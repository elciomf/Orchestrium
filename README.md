# Orchestrium

A lightweight and simple platform to create, schedule, and monitor workflows without its own syntax or unnecessary functionalities. Fully file-based and scheduling via CRON.

## 🚀 About

Orchestrium simplifies workflow management by allowing you to:

- Define workflows using simple files
- Schedule executions with CRON
- Monitor execution in real-time
- Keep everything in a centralized place

**Status**: ⚠️ Under development

## 🛠️ Technology Stack

- **Backend**: Go
- **Frontend**: Next.js (React)
- **Scheduling**: CRON

## 📋 Prerequisites

Before you begin, ensure you have installed:

- [Node.js](https://nodejs.org/)
- [Go](https://golang.org/doc/install)

## 🏃 How to Run

### 1. Clone the repository

```bash
git clone https://github.com/elciomf/Orchestrium.git
cd Orchestrium

```

### 2. Configure the Backend (Go)

Navigate to the backend folder:

```bash
cd server

```

Install the dependencies (if there is a `go.mod`):

```bash
go mod tidy

```

Run the server:

```bash
go run main.go

```

The backend will be available at `http://localhost:8080` (or the configured port)

### 3. Configure the Frontend (Next.js)

In another terminal, navigate to the frontend folder:

```bash
cd client

```

Install the dependencies:

```bash
npm install

```

Run the development server:

```bash
npm run dev

```

The frontend will be available at `http://localhost:3000`

## 📁 Project Structure

```
Orchestrium/
├── server/          # Go code
│   └── main.go
├── client/          # Next.js code
│   ├── components/
│   └── public/
└── README.md

```

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/MyFeature`)
3. Commit your changes (`git commit -m 'Add MyFeature'`)
4. Push to the branch (`git push origin feature/MyFeature`)
5. Open a Pull Request

## 📧 Contact

For questions or suggestions, open an [issue](https://github.com/elciomf/Orchestrium/issues) in the repository.

---

**Note**: This project is under development. The API and features may change.
