package models

import "time"

type WorkflowRequest struct {
	Name string `json:"name"`
	Expr string `json:"expr"`
}

type WorkflowResponse struct {
	Id   string     `json:"id" yaml:"-"`
	Name string     `json:"name" yaml:"name"`
	Expr string     `json:"expr" yaml:"expr"`
	Stts bool       `json:"stts" yaml:"stts"`
	Next *time.Time `json:"next,omitempty" yaml:"-"`
	Prev *time.Time `json:"prev,omitempty" yaml:"-"`
}

type FileRequest struct {
	Content string `json:"content"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type SuccessResponse struct {
	Message string `json:"message"`
}