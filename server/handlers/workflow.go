package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"orchestrium.sh/models"
	"orchestrium.sh/services"
)

type WorkflowHandler struct {
	service *services.WorkflowService
}

func NewWorkflowHandler(service *services.WorkflowService) *WorkflowHandler {
	return &WorkflowHandler{
		service: service,
	}
}

func (h *WorkflowHandler) GetAllWorkflows(ctx *gin.Context) {
	workflows, err := h.service.GetAllWorkflows()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, workflows)
}

func (h *WorkflowHandler) GetWorkflow(ctx *gin.Context) {
	id := ctx.Param("id")

	workflow, err := h.service.GetWorkflow(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	files, _ := h.service.GetWorkflowFiles(id)

	ctx.JSON(http.StatusOK, gin.H{
		"id":    workflow.Id,
		"name":  workflow.Name,
		"expr":  workflow.Expr,
		"stts":  workflow.Stts,
		"steps": workflow.Steps,
		"next":  workflow.Next,
		"prev":  workflow.Prev,
		"files": files,
	})
}

func (h *WorkflowHandler) CreateWorkflow(ctx *gin.Context) {
	var request models.WorkflowRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := h.service.CreateWorkflow(request)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"id": id})
}

func (h *WorkflowHandler) PauseWorkflow(ctx *gin.Context) {
	id := ctx.Param("id")

	if err := h.service.PauseWorkflow(id); err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Workflow pausado com sucesso"})
}

func (h *WorkflowHandler) ResumeWorkflow(ctx *gin.Context) {
	id := ctx.Param("id")

	if err := h.service.ResumeWorkflow(id); err != nil {
		statusCode := http.StatusInternalServerError
		if err.Error() == "o workflow já está ativo" {
			statusCode = http.StatusBadRequest
		}
		ctx.JSON(statusCode, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Workflow retomado com sucesso"})
}

func (h *WorkflowHandler) GetFile(ctx *gin.Context) {
	id := ctx.Param("id")
	filename := ctx.Param("name")

	content, err := h.service.GetFile(id, filename)
	if err != nil {
		if err.Error() == "acesso negado" {
			ctx.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"id":       id,
		"filename": filename,
		"content":  content,
	})
}

func (h *WorkflowHandler) UpdateFile(ctx *gin.Context) {
	id := ctx.Param("id")
	filename := ctx.Param("name")

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

	if err := h.service.UpdateFile(id, filename, content); err != nil {
		if err.Error() == "acesso negado" {
			ctx.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":  "Arquivo atualizado com sucesso",
		"id":       id,
		"filename": filename,
	})
}

func (h *WorkflowHandler) CreateFile(ctx *gin.Context) {
	id := ctx.Param("id")
	filename := ctx.Param("name")

	var request gin.H
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	content, ok := request["content"].(string)
	if !ok {
		content = "#!/usr/bin/env python3\n# Novo script\n\nprint(\"Hello, World!\")\n"
	}

	normalizedFilename := strings.TrimSuffix(filename, ".py")
	normalizedFilename += ".py"

	if err := h.service.CreateFile(id, normalizedFilename, content); err != nil {
		if err.Error() == "workflow não encontrado" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "acesso negado" {
			ctx.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{
		"message":  "Arquivo criado com sucesso",
		"id":       id,
		"filename": normalizedFilename,
	})
}

func (h *WorkflowHandler) DeleteFile(ctx *gin.Context) {
	id := ctx.Param("id")
	filename := ctx.Param("name")

	if err := h.service.DeleteFile(id, filename); err != nil {
		if err.Error() == "workflow não encontrado" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}
		if err.Error() == "acesso negado" {
			ctx.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"message":  "Arquivo deletado com sucesso",
		"id":       id,
		"filename": filename,
	})
}