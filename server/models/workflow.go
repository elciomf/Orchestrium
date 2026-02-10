package models

import "time"

type WorkflowRequest struct {
	Name string `json:"name"`
	Expr string `json:"expr"`
}

type WorkflowResponse struct {
	Id    string      `json:"id" yaml:"-"`
	Name  string      `json:"name" yaml:"name"`
	Expr  string      `json:"expr" yaml:"expr"`
	Stts  bool        `json:"stts" yaml:"stts"`
	Steps []Step      `json:"steps" yaml:"steps"`
	Next  *time.Time  `json:"next,omitempty" yaml:"-"`
	Prev  *time.Time  `json:"prev,omitempty" yaml:"-"`
}

type Step struct {
	Name     string   `json:"name" yaml:"name"`
	Script   string   `json:"script" yaml:"script"`
	Depends  []string `json:"depends" yaml:"depends"`
	Timeout  int      `json:"timeout" yaml:"timeout"`
	Attempts int      `json:"attempts" yaml:"attempts"`
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