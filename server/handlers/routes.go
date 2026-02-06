package handlers

import (
	"github.com/gin-gonic/gin"

	"orchestrium.sh/services"
)

func SetupRoutes(r *gin.Engine, workflowService *services.WorkflowService) {
	workflowHandler := NewWorkflowHandler(workflowService)

	workflows := r.Group("/workflows")
	{
		// Workflow operations
		workflows.GET("", workflowHandler.GetAllWorkflows)
		workflows.POST("", workflowHandler.CreateWorkflow)
		workflows.GET("/:id", workflowHandler.GetWorkflow)
		workflows.PATCH("/:id/pause", workflowHandler.PauseWorkflow)
		workflows.PATCH("/:id/resume", workflowHandler.ResumeWorkflow)

		// File operations
		workflows.GET("/:id/file/:name", workflowHandler.GetFile)
		workflows.POST("/:id/file/:name", workflowHandler.CreateFile)
		workflows.PATCH("/:id/file/:name", workflowHandler.UpdateFile)
		workflows.DELETE("/:id/file/:name", workflowHandler.DeleteFile)
	}
}