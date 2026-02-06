package main

import (
	"fmt"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/robfig/cron/v3"

	"orchestrium.sh/handlers"
	"orchestrium.sh/services"
)

func main() {
	scheduler := cron.New(cron.WithSeconds())
	scheduler.Start()
	defer scheduler.Stop()

	workflowService := services.NewWorkflowService(scheduler)

	if err := workflowService.BootstrapWorkflows(); err != nil {
		log.Printf("Erro ao fazer bootstrap dos workflows: %v\n", err)
	}

	r := gin.Default()

	handlers.SetupRoutes(r, workflowService)

	fmt.Println("API rodando na porta :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("Falha ao iniciar servidor:", err)
	}
}