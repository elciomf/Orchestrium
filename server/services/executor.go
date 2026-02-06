package services

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"orchestrium.sh/models"
)

type ExecutionState struct {
	StepName   string
	Status     string // "pending", "running", "success", "failed"
	Output     string
	Error      string
	StartTime  time.Time
	EndTime    time.Time
	Duration   time.Duration
}

type WorkflowExecutor struct {
	workflowID string
	steps      []models.Step
	state      map[string]*ExecutionState
	mu         sync.RWMutex
}

func NewWorkflowExecutor(workflowID string, steps []models.Step) *WorkflowExecutor {
	state := make(map[string]*ExecutionState)
	for _, step := range steps {
		state[step.Name] = &ExecutionState{
			StepName: step.Name,
			Status:   "pending",
		}
	}

	return &WorkflowExecutor{
		workflowID: workflowID,
		steps:      steps,
		state:      state,
	}
}

// Execute executa o workflow respeitando as dependências
func (we *WorkflowExecutor) Execute(ctx context.Context, srcPath string) error {
	fmt.Printf("[WORKFLOW %s] Iniciando execução\n", we.workflowID)

	// Criar mapa de steps por nome para acesso rápido
	stepMap := make(map[string]*models.Step)
	for i := range we.steps {
		stepMap[we.steps[i].Name] = &we.steps[i]
	}

	// Executar steps respeitando dependências
	for _, step := range we.steps {
		select {
		case <-ctx.Done():
			fmt.Printf("[WORKFLOW %s] Execução cancelada\n", we.workflowID)
			return ctx.Err()
		default:
		}

		// Aguardar dependências
		if err := we.awaitDependencies(step.Depends); err != nil {
			we.mu.Lock()
			we.state[step.Name].Status = "failed"
			we.state[step.Name].Error = fmt.Sprintf("Dependência falhou: %v", err)
			we.mu.Unlock()
			fmt.Printf("[WORKFLOW %s] Step %s falhou (dependência): %v\n", we.workflowID, step.Name, err)
			continue
		}

		// Executar step
		if err := we.executeStep(&step, srcPath); err != nil {
			fmt.Printf("[WORKFLOW %s] Step %s falhou: %v\n", we.workflowID, step.Name, err)
		}
	}

	fmt.Printf("[WORKFLOW %s] Execução concluída\n", we.workflowID)
	return nil
}

// awaitDependencies aguarda que todas as dependências sejam concluídas com sucesso
func (we *WorkflowExecutor) awaitDependencies(depends []string) error {
	if len(depends) == 0 {
		return nil
	}

	// Aguardar com timeout de 30 segundos (pode ser configurável)
	timeout := time.After(30 * time.Second)
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-timeout:
			return fmt.Errorf("timeout aguardando dependências")
		case <-ticker.C:
			we.mu.RLock()
			allDone := true
			var failedDeps []string

			for _, dep := range depends {
				if state, exists := we.state[dep]; exists {
					if state.Status == "pending" || state.Status == "running" {
						allDone = false
						break
					}
					if state.Status == "failed" {
						failedDeps = append(failedDeps, dep)
					}
				} else {
					// Dependência não existe
					failedDeps = append(failedDeps, dep)
				}
			}
			we.mu.RUnlock()

			if allDone {
				if len(failedDeps) > 0 {
					return fmt.Errorf("dependências falharam: %v", failedDeps)
				}
				return nil
			}
		}
	}
}

// executeStep executa um step individual
func (we *WorkflowExecutor) executeStep(step *models.Step, srcPath string) error {
	we.mu.Lock()
	we.state[step.Name].Status = "running"
	we.state[step.Name].StartTime = time.Now()
	we.mu.Unlock()

	scriptPath := filepath.Join(srcPath, step.Script)

	// Verificar se arquivo existe
	if _, err := os.Stat(scriptPath); os.IsNotExist(err) {
		we.mu.Lock()
		we.state[step.Name].Status = "failed"
		we.state[step.Name].Error = fmt.Sprintf("Script não encontrado: %s", scriptPath)
		we.state[step.Name].EndTime = time.Now()
		we.state[step.Name].Duration = we.state[step.Name].EndTime.Sub(we.state[step.Name].StartTime)
		we.mu.Unlock()
		return fmt.Errorf("script não encontrado: %s", step.Script)
	}

	// Preparar comando
	cmd := exec.Command("python3", scriptPath)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	// Executar com timeout se configurado
	var timeout time.Duration
	if step.Timeout > 0 {
		timeout = time.Duration(step.Timeout) * time.Second
	} else {
		timeout = 5 * time.Minute // timeout padrão
	}

	// Criar contexto com timeout
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	// Executar comando
	err := we.executeWithTimeout(ctx, cmd)

	we.mu.Lock()
	defer we.mu.Unlock()

	we.state[step.Name].EndTime = time.Now()
	we.state[step.Name].Duration = we.state[step.Name].EndTime.Sub(we.state[step.Name].StartTime)

	if err != nil {
		we.state[step.Name].Status = "failed"
		we.state[step.Name].Error = err.Error()
		fmt.Printf("[WORKFLOW %s] [STEP %s] Falhou: %v\n", we.workflowID, step.Name, err)
		return err
	}

	we.state[step.Name].Status = "success"
	fmt.Printf("[WORKFLOW %s] [STEP %s] Concluído com sucesso (%.2fs)\n", we.workflowID, step.Name, we.state[step.Name].Duration.Seconds())
	return nil
}

// executeWithTimeout executa um comando com timeout
func (we *WorkflowExecutor) executeWithTimeout(ctx context.Context, cmd *exec.Cmd) error {
	done := make(chan error, 1)

	go func() {
		done <- cmd.Run()
	}()

	select {
	case <-ctx.Done():
		// Timeout
		if cmd.Process != nil {
			cmd.Process.Kill()
		}
		return fmt.Errorf("execução expirada (timeout)")
	case err := <-done:
		return err
	}
}

// GetState retorna o estado atual da execução
func (we *WorkflowExecutor) GetState() map[string]*ExecutionState {
	we.mu.RLock()
	defer we.mu.RUnlock()

	// Fazer cópia para evitar race conditions
	stateCopy := make(map[string]*ExecutionState)
	for k, v := range we.state {
		stateCopy[k] = v
	}
	return stateCopy
}

// GetStepState retorna o estado de um step específico
func (we *WorkflowExecutor) GetStepState(stepName string) *ExecutionState {
	we.mu.RLock()
	defer we.mu.RUnlock()

	if state, exists := we.state[stepName]; exists {
		return state
	}
	return nil
}