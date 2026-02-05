package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/goccy/go-yaml"
	"github.com/google/uuid"
	"github.com/robfig/cron/v3"
)

type WorkflowRequest struct {
    Name string `json:"name"` 
    Expr string `json:"expr"`
}

type WorkflowResponse struct {
    Id   string `json:"id"   yaml:"-"`
    Name string `json:"name" yaml:"name"`
    Expr string `json:"expr" yaml:"expr"`
    Stts bool   `json:"stts" yaml:"stts"`
    Next *time.Time `json:"next,omitempty" yaml:"-"`
    Prev *time.Time `json:"prev,omitempty" yaml:"-"`
}

var registry = make(map[string]cron.EntryID)

func execute(s *cron.Cron, id string, expr string) error {
    if oldEntryID, exists := registry[id]; exists {
        s.Remove(oldEntryID)
    }

    entryID, err := s.AddFunc(expr, func() {
        fmt.Printf("[JOB %s] Executando tarefa do workflow...\n", id)
    })

    if err != nil {
        return err
    }

    registry[id] = entryID
    return nil
}

func main() {
	scheduler := cron.New(cron.WithSeconds())
	
	scheduler.Start()

	defer scheduler.Stop()

	r := gin.Default()

r.GET("/workflows", func(ctx *gin.Context) {
        entries, err := os.ReadDir("workflows")
        if err != nil {
            ctx.JSON(http.StatusOK, []WorkflowResponse{})
            return
        }

        response := make([]WorkflowResponse, 0)

        for _, entry := range entries {
            if entry.IsDir() {
                id := entry.Name()
                path := filepath.Join("workflows", id, "conf.yaml")

                data, err := os.ReadFile(path)
                if err != nil {
                    continue
                }

                var workflow WorkflowResponse
                err = yaml.Unmarshal(data, &workflow)

                if err != nil {
                    fmt.Printf("Erro ao ler YAML em %s: %v\n", id, err)
                    continue
                }

                workflow.Id = id

                if entryID, exists := registry[id]; exists {
                    cron := scheduler.Entry(entryID)
                    
                    if cron.ID != 0 {
                        if !cron.Next.IsZero() {
                            workflow.Next = &cron.Next
                        }
                        if !cron.Prev.IsZero() {
                            workflow.Prev = &cron.Prev
                        }
                    }
                }

                response = append(response, workflow)
            }
        }

        ctx.JSON(http.StatusOK, response)
    })

    r.GET("/workflows/:id", func(ctx *gin.Context) {
        id := ctx.Param("id")
        path := filepath.Join("workflows", id, "conf.yaml")

        data, err := os.ReadFile(path)
        if err != nil {
            ctx.JSON(http.StatusNotFound, gin.H{"error": "Workflow não encontrado"})
            return
        }

        var workflow WorkflowResponse
        if err := yaml.Unmarshal(data, &workflow); err != nil {
            ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao ler configuração"})
            return
        }

        workflow.Id = id

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

        ctx.JSON(http.StatusOK, gin.H{
            "id":    workflow.Id,
            "name":  workflow.Name,
            "expr":  workflow.Expr,
            "stts":  workflow.Stts,
            "files": files,
        })
    })

    r.GET("/workflows/:id/file/:name", func(ctx *gin.Context) {
        id := ctx.Param("id")
        filename := ctx.Param("name")

        path := filepath.Join("workflows", id, "conf.yaml")
        if _, err := os.ReadFile(path); err != nil {
            ctx.JSON(http.StatusNotFound, gin.H{"error": "Workflow não encontrado"})
            return
        }

        filePath := filepath.Join("workflows", id, "src", filename)

        absFilePath, _ := filepath.Abs(filePath)
        absSrcPath, _ := filepath.Abs(filepath.Join("workflows", id, "src"))
        
        if !filepath.HasPrefix(absFilePath, absSrcPath) {
            ctx.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado"})
            return
        }

        content, err := os.ReadFile(filePath)
        if err != nil {
            ctx.JSON(http.StatusNotFound, gin.H{"error": "Arquivo não encontrado"})
            return
        }

        ctx.JSON(http.StatusOK, gin.H{
            "id":       id,
            "filename": filename,
            "content":  string(content),
        })
    })

    r.PATCH("/workflows/:id/file/:name", func(ctx *gin.Context) {
        id := ctx.Param("id")
        filename := ctx.Param("name")

        path := filepath.Join("workflows", id, "conf.yaml")
        if _, err := os.ReadFile(path); err != nil {
            ctx.JSON(http.StatusNotFound, gin.H{"error": "Workflow não encontrado"})
            return
        }

        filePath := filepath.Join("workflows", id, "src", filename)

        absFilePath, _ := filepath.Abs(filePath)
        absSrcPath, _ := filepath.Abs(filepath.Join("workflows", id, "src"))
        
        if !filepath.HasPrefix(absFilePath, absSrcPath) {
            ctx.JSON(http.StatusForbidden, gin.H{"error": "Acesso negado"})
            return
        }

        var request gin.H
        if err := ctx.ShouldBindJSON(&request); err != nil {
            ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        content, ok := request["content"].(string)
        if !ok {
            ctx.JSON(http.StatusBadRequest, gin.H{"error": "Campo 'content' é obrigatório e deve ser string"})
            return
        }

        err := os.WriteFile(filePath, []byte(content), 0644)
        if err != nil {
            ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar arquivo"})
            return
        }

        ctx.JSON(http.StatusOK, gin.H{
            "message": "Arquivo atualizado com sucesso",
            "id":      id,
            "filename": filename,
        })
    })

    r.POST("/workflows", func(ctx *gin.Context) {
        var request WorkflowRequest
        if err := ctx.ShouldBindJSON(&request); err != nil {
            ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        id := uuid.New().String()
        path := filepath.Join("workflows", id)
        src := filepath.Join(path, "src")
        
        os.MkdirAll(src, 0755)

        conf := WorkflowResponse{
            Name: request.Name,
            Expr: request.Expr,
            Stts: true,
        }

        data, _ := yaml.Marshal(&conf)

        err := os.WriteFile(filepath.Join(path, "conf.yaml"), data, 0644)
        if err != nil {
            ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao salvar"})
            return
        }

        execute(scheduler, id, request.Expr)

        ctx.JSON(http.StatusCreated, gin.H{"id": id})
    })

    r.PATCH("/workflows/:id/pause", func(ctx *gin.Context) {
        id := ctx.Param("id")
        path := filepath.Join("workflows", id, "conf.yaml")

        data, err := os.ReadFile(path)
        if err != nil {
            ctx.JSON(http.StatusNotFound, gin.H{"error": "Workflow não encontrado"})
            return
        }

        var workflow WorkflowResponse
        if err := yaml.Unmarshal(data, &workflow); err != nil {
            ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao ler configuração"})
            return
        }

        if entryID, exists := registry[id]; exists {
            scheduler.Remove(entryID)
            delete(registry, id)
            fmt.Printf("[JOB %s] Pausado e removido do scheduler\n", id)
        }

        workflow.Stts = false
        new, _ := yaml.Marshal(&workflow)
        
        if err := os.WriteFile(path, new, 0644); err != nil {
            ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar arquivo"})
            return
        }

        ctx.JSON(http.StatusOK, gin.H{"message": "Workflow pausado com sucesso"})
    })

    r.PATCH("/workflows/:id/resume", func(ctx *gin.Context) {
        id := ctx.Param("id")
        path := filepath.Join("workflows", id, "conf.yaml")

        data, err := os.ReadFile(path)
        if err != nil {
            ctx.JSON(http.StatusNotFound, gin.H{"error": "Workflow não encontrado"})
            return
        }

        var workflow WorkflowResponse
        if err := yaml.Unmarshal(data, &workflow); err != nil {
            ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao ler configuração"})
            return
        }

        if workflow.Stts {
            ctx.JSON(http.StatusBadRequest, gin.H{"error": "O workflow já está ativo"})
            return
        }

        err = execute(scheduler, id, workflow.Expr)
        if err != nil {
            ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao agendar tarefa"})
            return
        }

        workflow.Stts = true
        new, _ := yaml.Marshal(&workflow)
        
        if err := os.WriteFile(path, new, 0644); err != nil {
            if entryID, exists := registry[id]; exists {
                scheduler.Remove(entryID)
                delete(registry, id)
            }
            ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Erro ao atualizar arquivo"})
            return
        }

        ctx.JSON(http.StatusOK, gin.H{"message": "Workflow retomado com sucesso"})
    })

    entries, _ := os.ReadDir("workflows")
    for _, entry := range entries {
        if entry.IsDir() {
            id := entry.Name()
            path := filepath.Join("workflows", id, "conf.yaml")
            data, _ := os.ReadFile(path)
            
            var w WorkflowResponse
            yaml.Unmarshal(data, &w)

            if w.Stts {
                execute(scheduler, id, w.Expr)
                fmt.Printf("[Bootstrap] Workflow %s iniciado\n", id)
            }
        }
    }

	fmt.Println("API rodando na porta :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Falha ao iniciar servidor:", err)
	}
}