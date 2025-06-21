# PromptHive  
PromptHive is an open-source system for collaborative prompt authoring designed to better connect domain knowledge with prompt engineering through features that encourage rapid iteration on prompt variations. It is implemented using React JS, Python, and Flask.

## Prototype Demo

[![PromptHive Video Figure](https://img.youtube.com/vi/8ZXyo5uSGtA/0.jpg)](https://www.youtube.com/watch?v=8ZXyo5uSGtA)

Note: You can also try a live version of the app here: https://tryprompthive.com/

## CHI 2025 Paper  
To credit this system, please cite our CHI'25 paper, "PromptHive: Bringing Subject Matter Experts Back to the Forefront with Collaborative Prompt Engineering for Educational Content Creation" Mohi Reza, Ioannis Anastasopoulos, Shreya Bhandari, Zachary A. Pardos. 2025

```bibtex
@inproceedings{reza2025prompthive,
  title={PromptHive: Bringing Subject Matter Experts Back to the Forefront with Collaborative Prompt Engineering for Educational Content Creation},
  author={Mohi Reza, Ioannis Anastasopoulos, Shreya Bhandari, Zachary A. Pardos},
  booktitle={Proceedings of the 2025 CHI Conference on Human Factors in Computing Systems},
  pages={1-24},
  organization={Association for Computing Machinery},
  doi={https://doi.org/10.1145/3706598.3714051},
  year={2025}
}
```
## Getting Started
These instructions will help you set up PromptHive locally for development or experimentation.

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Python 3.10+](https://www.python.org/)
- [Poetry](https://python-poetry.org/) for dependency management

---

### Setup Instructions

#### 1. Clone the repository

```bash
git clone https://github.com/mohireza/prompthive.git
cd prompthive
```

#### 2. Backend Setup

```bash
cd backend
poetry install
poetry run flask run
```

#### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend will be available at: `http://localhost:5173`  
Backend runs at: `http://127.0.0.1:5000`

---

## Environment Setup

Create a `.env` file inside the `backend/` folder. It should include your OpenAI API key and optional settings:

```env
OPENAI_API_KEY=your-openai-api-key-here
```

You can get your OpenAI API key from:  
https://platform.openai.com/account/api-keys

---

## Google Sheets Credentials

PromptHive integrates with the Google Sheets API. To enable this:

1. Go to the Google Cloud Console:  
   https://console.cloud.google.com/

2. Create a project and enable the following APIs:
   - Google Sheets API
   - Google Drive API

3. Under "Credentials", create an OAuth 2.0 Client ID:
   - Choose "Desktop App"
   - Download the JSON file and rename it to `credentials.json`

4. Move the file to:

```bash
backend/src/credentials.json
```

5. Or use the template:

```bash
cp backend/src/credentials.template.json backend/src/credentials.json
```

For more detailed instructions or to learn more, check out:
- Google Sheets API: https://developers.google.com/sheets/api
- OAuth 2.0: https://developers.google.com/identity/protocols/oauth2

---

## Acknowledgements

Special thanks to the following contributors for their valuable additions to the PromptHive codebase:

- [@sarvaSanjay](https://github.com/sarvaSanjay) — for designing and implementing the backend logging engine.
- [@MinecraftFuns](https://github.com/MinecraftFuns) — for assisting with live deployment during the user testing phase.
- [@shreyabhandari0220](https://github.com/shreyabhandari0220) — for enhancing the export feature and decoupling PromptHive from the ABScribe codebase.

PromptHive was originally built upon the [ABScribe](https://github.com/mohireza/abscribe) system, a <a href="https://dl.acm.org/doi/10.1145/3613904.3641899" target="_blank">CHI 2024</a> research prototype for exploring and organizing multiple writing variations using large language models. ABScribe provided the early architectural foundation and design insights for prompt variation workflows in PromptHive.

PromptHive also integrates closely with [OATutor](https://github.com/CAHLR/OATutor), a <a href="https://dl.acm.org/doi/full/10.1145/3544548.3581574" target="_blank">CHI 2023</a> open-source adaptive tutoring platform. OATutor inspired key elements of the educational content authoring workflow supported by PromptHive.

We’re grateful to both the ABScribe team at the University of Toronto and the OATutor team at UC Berkeley for their open-source contributions to the learning sciences and HCI research communities.

