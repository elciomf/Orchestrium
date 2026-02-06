package services

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"github.com/goccy/go-yaml"
	"github.com/google/uuid"
	"github.com/robfig/cron/v3"

	"orchestrium.sh/models"
)

type WorkflowService struct {
	scheduler *cron.Cron
	registry  map[string]cron.EntryID
	mu        sync.RWMutex
}

func NewWorkflowService(scheduler *cron.Cron) *WorkflowService {
	return &WorkflowService{
		scheduler: scheduler,
		registry:  make(map[string]cron.EntryID),
	}
}

func (ws *WorkflowService) Execute(id string, expr string) error {
	ws.mu.Lock()
	defer ws.mu.Unlock()

	if oldEntryID, exists := ws.registry[id]; exists {
		ws.scheduler.Remove(oldEntryID)
	}

	entryID, err := ws.scheduler.AddFunc(expr, func() {
		// Ler o arquivo conf.yaml a cada execução
		path := filepath.Join("workflows", id, "conf.yaml")
		data, err := os.ReadFile(path)
		if err != nil {
			fmt.Printf("[WORKFLOW %s] Erro ao ler conf.yaml: %v\n", id, err)
			return
		}

		var workflow models.WorkflowResponse
		if err := yaml.Unmarshal(data, &workflow); err != nil {
			fmt.Printf("[WORKFLOW %s] Erro ao fazer parse do YAML: %v\n", id, err)
			return
		}

		// Validar se há steps
		if len(workflow.Steps) == 0 {
			fmt.Printf("[WORKFLOW %s] Nenhum step configurado\n", id)
			return
		}

		// Criar executor
		srcPath := filepath.Join("workflows", id, "src")
		executor := NewWorkflowExecutor(id, workflow.Steps)

		// Executar com contexto (sem timeout global, deixar para os steps)
		ctx := context.Background()
		if err := executor.Execute(ctx, srcPath); err != nil {
			fmt.Printf("[WORKFLOW %s] Erro na execução: %v\n", id, err)
		}
	})

	if err != nil {
		return err
	}

	ws.registry[id] = entryID
	return nil
}

func (ws *WorkflowService) GetAllWorkflows() ([]models.WorkflowResponse, error) {
	entries, err := os.ReadDir("workflows")
	if err != nil {
		return []models.WorkflowResponse{}, nil
	}

	response := make([]models.WorkflowResponse, 0)

	for _, entry := range entries {
		if entry.IsDir() {
			id := entry.Name()
			path := filepath.Join("workflows", id, "conf.yaml")

			data, err := os.ReadFile(path)
			if err != nil {
				continue
			}

			var workflow models.WorkflowResponse
			err = yaml.Unmarshal(data, &workflow)

			if err != nil {
				fmt.Printf("Erro ao ler YAML em %s: %v\n", id, err)
				continue
			}

			workflow.Id = id
			ws.enrichWorkflowWithSchedulerInfo(&workflow)
			response = append(response, workflow)
		}
	}

	return response, nil
}

func (ws *WorkflowService) GetWorkflow(id string) (*models.WorkflowResponse, error) {
	path := filepath.Join("workflows", id, "conf.yaml")

	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("workflow não encontrado")
	}

	var workflow models.WorkflowResponse
	if err := yaml.Unmarshal(data, &workflow); err != nil {
		return nil, fmt.Errorf("erro ao ler configuração")
	}

	workflow.Id = id
	ws.enrichWorkflowWithSchedulerInfo(&workflow)

	return &workflow, nil
}

func (ws *WorkflowService) CreateWorkflow(req models.WorkflowRequest) (string, error) {
	id := uuid.New().String()
	path := filepath.Join("workflows", id)
	src := filepath.Join(path, "src")

	if err := os.MkdirAll(src, 0755); err != nil {
		return "", fmt.Errorf("erro ao criar diretórios")
	}

	conf := models.WorkflowResponse{
		Name:  req.Name,
		Expr:  req.Expr,
		Stts:  true,
		Steps: []models.Step{},
	}

	data, _ := yaml.Marshal(&conf)

	if err := os.WriteFile(filepath.Join(path, "conf.yaml"), data, 0644); err != nil {
		return "", fmt.Errorf("erro ao salvar configuração")
	}

	if err := ws.Execute(id, req.Expr); err != nil {
		return "", fmt.Errorf("erro ao agendar tarefa")
	}

	return id, nil
}

func (ws *WorkflowService) PauseWorkflow(id string) error {
	path := filepath.Join("workflows", id, "conf.yaml")

	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("workflow não encontrado")
	}

	var workflow models.WorkflowResponse
	if err := yaml.Unmarshal(data, &workflow); err != nil {
		return fmt.Errorf("erro ao ler configuração")
	}

	ws.mu.Lock()
	if entryID, exists := ws.registry[id]; exists {
		ws.scheduler.Remove(entryID)
		delete(ws.registry, id)
		fmt.Printf("[JOB %s] Pausado e removido do scheduler\n", id)
	}
	ws.mu.Unlock()

	workflow.Stts = false
	newData, _ := yaml.Marshal(&workflow)

	if err := os.WriteFile(path, newData, 0644); err != nil {
		return fmt.Errorf("erro ao atualizar arquivo")
	}

	return nil
}

func (ws *WorkflowService) ResumeWorkflow(id string) error {
	path := filepath.Join("workflows", id, "conf.yaml")

	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("workflow não encontrado")
	}

	var workflow models.WorkflowResponse
	if err := yaml.Unmarshal(data, &workflow); err != nil {
		return fmt.Errorf("erro ao ler configuração")
	}

	if workflow.Stts {
		return fmt.Errorf("o workflow já está ativo")
	}

	if err := ws.Execute(id, workflow.Expr); err != nil {
		return fmt.Errorf("erro ao agendar tarefa")
	}

	workflow.Stts = true
	newData, _ := yaml.Marshal(&workflow)

	if err := os.WriteFile(path, newData, 0644); err != nil {
		ws.mu.Lock()
		if entryID, exists := ws.registry[id]; exists {
			ws.scheduler.Remove(entryID)
			delete(ws.registry, id)
		}
		ws.mu.Unlock()
		return fmt.Errorf("erro ao atualizar arquivo")
	}

	return nil
}

func (ws *WorkflowService) GetWorkflowFiles(id string) ([]string, error) {
	path := filepath.Join("workflows", id, "conf.yaml")
	if _, err := os.ReadFile(path); err != nil {
		return nil, fmt.Errorf("workflow não encontrado")
	}

	srcPath := filepath.Join("workflows", id, "src")
	files := make([]string, 0)

	entries, err := os.ReadDir(srcPath)
	if err == nil {
		for _, entry := range entries {
			if !entry.IsDir() {
				files = append(files, entry.Name())
			}
		}
	}

	return files, nil
}

func (ws *WorkflowService) GetFile(id string, filename string) (string, error) {
	path := filepath.Join("workflows", id, "conf.yaml")
	if _, err := os.ReadFile(path); err != nil {
		return "", fmt.Errorf("workflow não encontrado")
	}

	filePath := filepath.Join("workflows", id, "src", filename)

	if !ws.isPathSafe(id, filePath) {
		return "", fmt.Errorf("acesso negado")
	}

	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("arquivo não encontrado")
	}

	return string(content), nil
}

func (ws *WorkflowService) UpdateFile(id string, filename string, content string) error {
	path := filepath.Join("workflows", id, "conf.yaml")
	if _, err := os.ReadFile(path); err != nil {
		return fmt.Errorf("workflow não encontrado")
	}

	filePath := filepath.Join("workflows", id, "src", filename)

	if !ws.isPathSafe(id, filePath) {
		return fmt.Errorf("acesso negado")
	}

	if err := os.WriteFile(filePath, []byte(content), 0644); err != nil {
		return fmt.Errorf("erro ao atualizar arquivo")
	}

	return nil
}

func (ws *WorkflowService) BootstrapWorkflows() error {
	entries, err := os.ReadDir("workflows")
	if err != nil {
		return nil
	}

	for _, entry := range entries {
		if entry.IsDir() {
			id := entry.Name()
			path := filepath.Join("workflows", id, "conf.yaml")
			data, _ := os.ReadFile(path)

			var w models.WorkflowResponse
			yaml.Unmarshal(data, &w)

			if w.Stts {
				ws.Execute(id, w.Expr)
				fmt.Printf("[Bootstrap] Workflow %s iniciado\n", id)
			}
		}
	}

	return nil
}

func (ws *WorkflowService) enrichWorkflowWithSchedulerInfo(workflow *models.WorkflowResponse) {
	ws.mu.RLock()
	defer ws.mu.RUnlock()

	if entryID, exists := ws.registry[workflow.Id]; exists {
		cron := ws.scheduler.Entry(entryID)

		if cron.ID != 0 {
			if !cron.Next.IsZero() {
				workflow.Next = &cron.Next
			}
			if !cron.Prev.IsZero() {
				workflow.Prev = &cron.Prev
			}
		}
	}
}

func (ws *WorkflowService) isPathSafe(id string, filePath string) bool {
	absFilePath, _ := filepath.Abs(filePath)
	absSrcPath, _ := filepath.Abs(filepath.Join("workflows", id, "src"))

	return filepath.HasPrefix(absFilePath, absSrcPath)
}

func (ws *WorkflowService) CreateFile(id string, filename string, content string) error {
	path := filepath.Join("workflows", id, "conf.yaml")
	if _, err := os.ReadFile(path); err != nil {
		return fmt.Errorf("workflow não encontrado")
	}

	filePath := filepath.Join("workflows", id, "src", filename)

	if !ws.isPathSafe(id, filePath) {
		return fmt.Errorf("acesso negado")
	}

	if _, err := os.Stat(filePath); err == nil {
		return fmt.Errorf("arquivo já existe")
	}

	if err := os.WriteFile(filePath, []byte(content), 0755); err != nil {
		return fmt.Errorf("erro ao criar arquivo")
	}

	return nil
}

func (ws *WorkflowService) DeleteFile(id string, filename string) error {
	path := filepath.Join("workflows", id, "conf.yaml")
	if _, err := os.ReadFile(path); err != nil {
		return fmt.Errorf("workflow não encontrado")
	}

	filePath := filepath.Join("workflows", id, "src", filename)

	if !ws.isPathSafe(id, filePath) {
		return fmt.Errorf("acesso negado")
	}

	if err := os.Remove(filePath); err != nil {
		return fmt.Errorf("erro ao deletar arquivo")
	}

	return nil
}
