package handlers

import (
	"github.com/gin-gonic/gin"

	"orchestrium.sh/services"
)

func SetupRoutes(r *gin.Engine, workflowService *services.WorkflowService) {
	workflowHandler := NewWorkflowHandler(workflowService)

	workflows := r.Group("/workflows")
	{
		workflows.GET("", workflowHandler.GetAllWorkflows)
		workflows.POST("", workflowHandler.CreateWorkflow)
		workflows.GET("/:id", workflowHandler.GetWorkflow)
		workflows.PATCH("/:id/pause", workflowHandler.PauseWorkflow)
		workflows.PATCH("/:id/resume", workflowHandler.ResumeWorkflow)
		workflows.GET("/:id/file/:name", workflowHandler.GetFile)
		workflows.PATCH("/:id/file/:name", workflowHandler.UpdateFile)
	}
}