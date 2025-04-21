from functools import partial
from typing import Literal

from pydantic import BaseModel

from src.services.latex_converter_service import preprocess_text_to_latex

OATUTOR_HINT_EXAMPLE_JSON = {
    "hints": [
        {
            "Problem Name": "{{problemName}}",
            "Row Type": "<hint or scaffold>",
            "Title": "<title of the hint>",
            "Body Text": "<body text of the hint>",
            "Answer": "<answer if the Row Type is scaffold, blank otherwise>",
            "answerType": "<numeric or algebra or mc>",
            "HintID": "<hX where x is the unique hint number.>",
            "Dependency": "<id of hint on which this hint depends on, keep blank if no dependency>",
            "mcChoices": "<answer choices if answerType is mc, blank otherwise. Seperate answer choices with |>",
        },
    ],
}

_convert_rendered = partial(preprocess_text_to_latex, tutoring=False)
_convert_tutoring = partial(preprocess_text_to_latex, tutoring=True)
_convert_mc = partial(preprocess_text_to_latex, tutoring=True, stepMC=True)


class OatutorHint(BaseModel):
    problem_name: str
    row_type: Literal["hint", "scaffold"]
    title: str
    body_text: str
    answer: str
    answer_type: Literal["numeric", "algebra", "mc"]
    hint_id: str
    dependency: str
    mc_choices: str

    def to_json(self) -> dict:
        return {
            "Problem Name": self.problem_name,
            "Row Type": self.row_type,
            "Title": self.title,
            "Title Rendered": _convert_rendered(self.title)[0],
            "Title Tutoring": _convert_tutoring(self.title)[0],
            "Body Text": self.body_text,
            "Body Text Rendered": _convert_rendered(self.body_text)[0],
            "Body Text Tutoring": _convert_tutoring(self.body_text)[0],
            "Answer": self.answer,
            "Answer Rendered": _convert_rendered(self.answer)[0],
            "Answer Tutoring": _convert_tutoring(self.answer)[0],
            "answerMCR": (
                _convert_mc(self.answer)[0] if self.answer_type == "mc" else ""
            ),
            "answerType": self.answer_type,
            "answerType Rendered": _convert_rendered(self.answer_type)[0],
            "answerType Tutoring": _convert_tutoring(self.answer_type)[0],
            "HintID": self.hint_id,
            "Dependency": self.dependency,
            "mcChoices": self.mc_choices,
            "mcChoicesMCR": (
                "<separator_eba4b31e>".join(
                    map(
                        lambda text: _convert_mc(text)[0],
                        self.mc_choices.split("|"),
                    )
                )
                if self.answer_type == "mc"
                else ""
            ),
        }


class OatutorHints(BaseModel):
    hints: list[OatutorHint]

    def to_json(self) -> dict:
        return {"hints": list(map(OatutorHint.to_json, self.hints))}
