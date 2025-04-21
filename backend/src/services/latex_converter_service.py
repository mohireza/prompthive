"""
Copyright (c) Developers of the Computational Approaches to Human Learning at
the University of California, Berkeley, licensed under the MIT License.

The original code can be accessed at: https://github.com/CAHLR/OATutor-Tooling/blob/main/content_script/process_text.py

Modifications made by Joe Fang <i@joefang.org>, also under the MIT License.
"""

import re

from pytexit import py2tex

# import sys

# from tkinter import WORD
# sys.path.insert(0, "../textToLatex")
# import io


# sys.stdout = io.TextIOWrapper(sys.stdout.detach(), encoding = 'utf-8')
# sys.stderr = io.TextIOWrapper(sys.stderr.detach(), encoding = 'utf-8')


targeted_columns = ["Title", "Body Text", "Answer", "answerType"]


def annotate_sheet_data(sheet: list[list[str]]) -> None:
    render_normal_columns(sheet=sheet, targeted_columns=targeted_columns)
    render_multiple_choices(sheet=sheet)


def render_normal_columns(sheet: list[list[str]], targeted_columns: list[str]) -> None:
    headers = sheet[0]
    # print(headers)
    maximum_length = max(map(len, sheet))
    # ensure that the header line is long enough
    for _ in range(len(headers), maximum_length):
        headers.append("")
    targeted_indices: list[tuple[int, int, int]] = []
    for column in targeted_columns:
        try:
            index = headers.index(column)
            rendered_index = maximum_length
            maximum_length += 1
            rendered_column = column + " Rendered"
            headers.append(rendered_column)
            tutoring_index = maximum_length
            maximum_length += 1
            tutoring_column = column + " Tutoring"
            headers.append(tutoring_column)
            targeted_indices.append((index, rendered_index, tutoring_index))
        except ValueError:
            print("[error] column", column, "not found")
            pass

    if len(targeted_indices) == 0:
        # no target found
        return

    for i in range(1, len(sheet)):
        line = sheet[i]
        for _ in range(len(line), maximum_length):
            line.append("")
        for index, rendered_index, tutoring_index in targeted_indices:
            if line[index]:
                line[rendered_index] = preprocess_text_to_latex(
                    line[index], tutoring=False
                )[0]
                line[tutoring_index] = preprocess_text_to_latex(
                    line[index], tutoring=True
                )[0]


def render_multiple_choices(sheet: list[list[str]]) -> None:
    # Example OpenStax sheet: <https://bit.ly/46so7yc>
    headers = sheet[0]
    try:
        answer_index = headers.index("Answer")
        answer_type_index = headers.index("answerType")
        mc_choices_index = headers.index("mcChoices")
    except ValueError:
        print(
            "[error] answer_type_index not found in headers; please ensure the sheet conforms to the OpenStax format"
        )
        return
    maximum_length = max(map(len, sheet))
    answer_mcr_index = maximum_length
    headers.append("answerMCR")
    maximum_length += 1
    mc_choices_mcr_index = maximum_length
    headers.append("mcChoicesMCR")
    maximum_length += 1
    for i in range(1, len(sheet)):
        line = sheet[i]
        for _ in range(len(line), maximum_length):
            line.append("")
        if line[answer_type_index] == "mc":
            # Reference: <https://bit.ly/3WIs1zA>
            line[answer_mcr_index] = preprocess_text_to_latex(
                line[answer_index], tutoring=True, stepMC=True
            )[0]
            # Reference: <https://bit.ly/3Adlrby>
            line[mc_choices_mcr_index] = "<separator_eba4b31e>".join(
                map(
                    lambda text: preprocess_text_to_latex(
                        text, tutoring=True, stepMC=True
                    )[0],
                    line[mc_choices_index].split("|"),
                )
            )


"""
The following code is authored by the developers at UC Berkeley and remains unmodified.
"""


supported_operators = ["**", "/", "*", "+", ">", "<", "=", "_", "~"]
supported_word_operators = [
    "sqrt",
    "abs(",
    "inf",
    "log{",
    "ln{",
    "log(",
    "sum{",
    "\\theta",
    "/mat",
    "/tab",
    "/lim" "/int",
]
answer_only_operators = ["-"]
skip_braces_operators = ["ln{", "log{", "/mat", "sum{", "_{", "/tab", "/lim", "/int"]
trig_operators = ["sin", "cos", "tan", "csc", "sec", "cot"]
replace = {
    "⋅": "*",
    "−": "-",
    "^": "**",
    "𝑥": "x",
    "𝑎": "a",
    "𝑏": "b",
    "𝑦": "y",
    "–": "-",
    "≥": ">=",
    "≤": "<=",
    "∪": "U",
    "\\cap": "∩",
    "π": "pi",
    "µ": "\\mu",
    "α": "\\alpha",
    "≠": "!=",
}
conditionally_replace = {"[": "(", "]": ")"}
regex = re.compile("|".join(map(re.escape, replace.keys())))
force_latex = 0.0
match = {"(": ")", "{": "}", "[": "]", "\\left(": "\\right)"}


# Figure out way to deal with equal signs
def preprocess_text_to_latex(
    text, tutoring=False, stepMC=False, render_latex="TRUE", verbosity=False
):
    global force_latex
    if render_latex == "TRUE":
        render_latex = True
    else:
        render_latex = False

    if render_latex:
        text = str(text)
        text = regex.sub(lambda match: replace[match.group(0)], text)
        if not re.findall(
            "[\[|\(][-\d\s\w/]+,[-\d\s\w/]+[\)|\]]", text
        ):  # Checking to see if there are coordinates/intervals before replacing () with []
            text = regex.sub(lambda match: conditionally_replace[match.group(0)], text)

        # Account for space in sqrt(x, y)
        text = re.sub(r"sqrt[\s]?\(([^,]+),[\s]+([^\)])\)", r"sqrt(\g<1>,\g<2>)", text)
        text = re.sub(r"sqrt(?:\s*)?\(", r"sqrt(", text)
        text = re.sub(r"abs(?:\s*)?\(", r"abs(", text)
        text = re.sub(
            "\([\s]*([-\d]+)[\s]*,[\s]*([-\d]+)[\s]*\)", "(\g<1>,\g<2>)", text
        )  # To account for coordinates
        text = re.sub(
            '\s\\\\"\s', " ", text
        )  # To account for quoted LaTeX expressions.
        text = re.sub("\\\\pipe", "|", text)  # To account for literal | in mc answers
        text = re.sub(r"\\/", r"\\\\slash\\\\", text)  # To account for literal /
        text = re.sub(r"@{(\d+|\w+)}", r"aaa\g<1>ttt", text)  # For variabilization
        text = re.sub(
            r"_\{([\w]+),([\w]+)\}", r"_\g<1>_\g<2>", text
        )  # To account for subscript in form of A_{i,j} (change to A_ij)
        text = re.sub(
            "_\(([^)]+)\)", "_\g<1>", text
        )  # To account for subscript in form of A_(BC) (chage to A_BC)
        text = re.sub(r"_{2,}", r"___", text)

    # Handle newline
    text = re.sub(r"\n", " |newline| ", text)

    words = text.split()
    latex = False
    for i in list(range(len(words))):
        word = words[i]
        word = re.sub(r"(\d)(?<![a-zA-Z])pi", r"\g<1>*pi", word)
        if use_latex(word, render_latex, stepMC):
            if not re.findall(
                "[\[|\(][\+\-\*/\(\)\d\s\w]+,[\+\-\*/\(\)\d\s\w]+[\)|\]]", word
            ):  # only add in space if is not coordinate
                word = re.sub(",(\S)", ", \g<1>", word)

            strip_punc = word[-1] in "?.,:"
            quote = False
            open_braces = closing_braces = False
            # if the word is wrapped in quote.
            if (word[:2] == '\\"' and word[-2:] == '\\"') or (
                word[0] == "\\'" and word[-1] == "\\'"
            ):
                word = word[2:-2]
                quote = True
            # if the word contains
            if strip_punc:
                punctuation = word[-1]
                word = word[:-1]
            else:
                punctuation = ""
            # handles braces in LaTeX
            if word[:1] == "{":
                open_braces = True
                word = word[1:]
            if word[-1:] == "}" and all(
                [op not in word for op in skip_braces_operators]
            ):
                closing_braces = True
                word = word[:-1]
            # if the word is forced latex
            if word[:2] == "$$" and word[-2:] == "$$":
                word = word[2:-2]
            elif word[:2] == "$$":
                word = word[2:]
            elif word[-2:] == "$$":
                word = word[:-2]

            # process each side of the equation
            try:
                sides = re.split("((?<!\\\\)`|=|U|∩|<=|>=|!=|_{3})", word)
                sides = [handle_word(side) for side in sides]
                new_word = ""
                if tutoring and stepMC:
                    new_word = "$$" + "".join(sides) + "$$"
                else:
                    if quote:
                        new_word = (
                            "$$"
                            + '\\"'
                            + "".join([side.replace("\\", "\\") for side in sides])
                            + '\\"'
                            + "$$"
                        )
                    else:
                        new_word = (
                            "$$"
                            + "".join([side.replace("\\", "\\") for side in sides])
                            + "$$"
                        )
                    new_word = re.sub(r"\\\\\"\$\$", r"\"$$", new_word)
                    new_word = re.sub(r"\$\$\\\\\"", r"$$\"", new_word)
                if strip_punc:
                    new_word += punctuation
                if open_braces:
                    new_word = "{" + new_word
                if closing_braces:
                    new_word = new_word + "}"
                new_word = re.sub(r"\\operatorname{or}", r"|", new_word)
                latex = True
                words[i] = new_word

            except Exception as e:
                if verbosity:
                    print("This failed")
                    print(word)
                    print(e)
                pass
        # if forced verbatim
        if word[:2] == "##" and word[-2:] == "##":
            words[i] = word[2:-2]
        elif word[:2] == "##":
            words[i] = word[2:]
        elif word[-2:] == "##":
            words[i] = word[:-2]
    text = " ".join(words)
    text = re.sub(r"\\\\slash\\\\", "/", text)
    text = re.sub(r"aaa(\w+|\d+)ttt", r"@{\g<1>}", text)
    text = re.sub(r"\s*\|newline\|\s*", "\\\\n", text)
    force_latex = 0.0
    return text, latex


def use_latex(word, render_latex, stepMC):
    global force_latex
    if word[:2] == "$$" and word[-2:] == "$$":
        force_latex = 0.0
        return True
    if word[:2] == "$$":
        force_latex = True
        return True
    if word[-2:] == "$$":
        force_latex = 0.0
        return True
    if word[:2] == "##" and word[-2:] == "##":
        force_latex = 0.0
        return False
    if word[:2] == "##":
        force_latex = False
        return False
    if word[-2:] == "##":
        force_latex = 0.0
        return False
    if type(force_latex) != float and force_latex:
        return True
    if type(force_latex) != float and not force_latex:
        return False
    if not render_latex:
        return False
    if stepMC and any([op in word for op in answer_only_operators]):
        return True
    parts = word.split("-")
    for part in parts:
        if (
            any([op in part for op in supported_operators])
            or any([op in part for op in supported_word_operators])
            and "info" not in part
        ):
            if "inf" in part and (
                any([op in part for op in supported_operators])
                or any([op in part for op in supported_word_operators if op != "inf"])
            ):
                return True
            if part == "inf" or not part.isalpha():
                return True
        if (
            re.match("[\d\.]*[bdhmnprtxyz][.\?\!,\%\$]{,1}$", part)
            and "y-coord" not in word
        ):
            verbose_words = [
                "y-axis",
                "y-coord",
                "y-intercept",
                "y-value",
                "x-axis",
                "x-coord",
                "x-intercept",
                "x-value",
            ]
            if not any([v in word for v in verbose_words]):
                return True
    if "(" in word and ")" in word and "-" in word:
        return True
    if re.search("\d-\d", word):
        return True
    if re.search("\.\d", word):
        return True
    if re.search("\([\d\.]+,[\d\.]+\)", word):
        return True
    if re.match("-*\d+[.\,]*$", word):
        return True
    return False


def handle_word(word, coord=True):
    latex_dic = {
        "=": "=",
        "U": " \cup ",
        "∩": " \cap ",
        "<=": " \leq ",
        ">=": " \geq ",
        "!=": " \\neq ",
    }
    if word in latex_dic:
        return latex_dic[word]

    if r"/mat" in word:
        matches = re.finditer("/mat{.+?}", word)
        for mat in matches:
            word = re.sub(
                re.escape(mat.group(0)), handle_single_matrix(mat.group(0)), word
            )
        return word

    if r"/tab" in word:
        matches = re.finditer("/tab{.+?}", word)
        for mat in matches:
            word = re.sub(
                re.escape(mat.group(0)), handle_single_table(mat.group(0)), word
            )
        return word

    if r"/lim" in word:
        word = re.sub("\s", "", word)
        matches = re.finditer("/lim{.+?}", word)
        for mat in matches:
            word = re.sub(
                re.escape(mat.group(0)), handle_single_limit(mat.group(0)), word
            )
        return word

    if r"/int" in word:
        word = re.sub("\s", "", word)
        matches = re.finditer("/int{.+?}", word)
        for mat in matches:
            word = re.sub(
                re.escape(mat.group(0)), handle_single_integral(mat.group(0)), word
            )
        return word

    if not (
        any([op in word for op in supported_operators])
        or any([op in word for op in supported_word_operators])
    ):
        word = re.sub("𝜃", "\\\\theta", word)
        word = re.sub("°", "\\\\degree", word)
        word = re.sub("θ", "\\\\theta", word)
        word = re.sub("ε", "\\\\varepsilon", word)
        word = re.sub("λ", "\\\\lambda", word)
        word = re.sub("𝛼", "\\\\alpha", word)
        word = re.sub(r"%", "\\\\%", word)
        word = re.sub(r"\$", "\\\\$", word)
        return word

    if "log{" in word:
        nums = [a.group(1) for a in re.finditer("log\{[^}]+\}\{([^}]+)\}", word)]
        latex_nums = [re.sub(r"\\", r"\\\\", handle_word(n)) for n in nums]
        while re.search("log\{", word):
            word = re.sub(
                "log\{([^}]+)\}\{[^}]+\}",
                r"\\log_{\g<1>}\\left(" + latex_nums[0] + r"\\right)",
                word,
                count=1,
            )
            latex_nums.pop(0)
        return word

    if "ln{" in word:
        return re.sub("ln{", r"\\ln{", word)

    coordinates = re.findall(
        "(?<!sqrt)[\(|\[][(sqrt)\+\-\*/\(\)_\d\s\w]+,[(sqrt)\+\-\*/\(\)_\d\s\w]+[\)|\]]",
        word,
    )
    nth_root = re.search("sqrt\([+\-\*/\(\)\d\w]+(,)[+\-\*/\(\)\d\w]+\)", word)
    if nth_root:
        comma_idx = nth_root.start(1)
        sqrt_end_idx = find_matching(
            word, word[nth_root.start() + 4], nth_root.start() + 4
        )
        if sqrt_end_idx < comma_idx:
            nth_root = None
    if coord and coordinates and not nth_root:
        trailing = ""
        if word[-1] != ")" and word[-1] != "]":
            trailing = word[-1]
            word = word[:-1]
        first = re.search("(\(|\[)([-\d\s\D]+),", word)
        rest = word[word.index(first.group(0)) + len(first.group(0)) - 1 :]
        second = re.search(",([-\d\s\D]+)(\)|\])", rest)
        xcoord = handle_word(first.group(2), coord=False)
        ycoord = handle_word(second.group(1), coord=False)
        new_coord = first.group(1) + xcoord + "," + ycoord + second.group(2) + trailing
        new_coord = re.sub(r"\\", r"\\\\", new_coord)
        return re.sub("[\(|\[][-\d\D]+,[-\d\D]+[\)|\]]", new_coord, word)

    word = re.sub("\+/-", "~", word)
    word = re.sub("(.+)~", "\g<1>+plusminus+", word)

    scientific_notation = re.findall("\(?([\d]{2,})\)?\*([\d]{2,})\*\*", word)
    word = re.sub(":sqrt", ": sqrt", word)
    square_roots = re.findall(r"sqrt\(([^,]*)\,([^\)]*)\)", word)
    word = re.sub(",", "", word)
    for root in square_roots:
        word = re.sub(
            r"sqrt\(" + re.escape(root[0]) + re.escape(root[1]) + "\)",
            r"sqrt(" + root[0] + "," + root[1] + ")",
            word,
        )
    word = re.sub(r"(^ln[\w])(\(+[\w])", "\g<1>*\g<2>", word)
    word = re.sub(r"(\)+)([\w])", "\g<1>*\g<2>", word)
    word = re.sub(r"(\))(\()", "\g<1>*\g<2>", word)
    word = re.sub(r"([0-9]+)([a-zA-Z])", "\g<1>*\g<2>", word)
    word = re.sub(r"sqrt\*", r"sqrt", word)
    word = re.sub(r"abs\*", r"abs", word)
    word = re.sub("\*\*\(\-0.", "**(zero", word)
    word = re.sub("\*\*\(\-\.", "**(zero", word)
    word = re.sub("(?<!(abs)|(log)|(qrt))\(\-", "negneg(", word)
    word = re.sub(r"\\=", "=", word)
    word = re.sub(r"\'", r"primesymbol", word)
    word = re.sub(r"\\theta", r"theta", word)
    word = re.sub(r"←", r"getsgets", word)
    word = re.sub(r"\.\.\.", r"dotdotdot", word)
    bracketsub = re.search("\[([^\(^\)]+)\]", word)
    word = re.sub("\[([^\(^\)^\[^\]]+)\]", "bracketsub", word)
    # to handle -(.....) missing parenthesis instance
    while re.search("-\([^\w\d\(]", word):
        open_par_miss = re.search("-\([^\w\d]", word).start() + 1
        close_par_miss = find_matching(word, "(", open_par_miss)
        word = word[:close_par_miss] + "+rightt" + word[close_par_miss + 1 :]
        word = word[:open_par_miss] + "leftt+" + word[open_par_miss + 1 :]

    sum_match = re.search("sum{([^}]+)}{([^}]+)}{([^}]+)}", word)
    if sum_match:
        sum_var, sum_lower = sum_match.group(1).split("=")
        sum_upper_num = True
        if sum_match.group(2).isnumeric():
            sum_upper = str(int(sum_match.group(2)) + 1)
        else:
            sum_upper = sum_match.group(2)
            sum_upper_num = False
        word = (
            "sum(["
            + sum_match.group(3)
            + " for "
            + sum_var
            + " in range("
            + sum_lower
            + ","
            + sum_upper
            + ")])"
        )

    word = py2tex(word, print_latex=False, print_formula=False, simplify_output=False)

    # Here do the substitutions for the things that py2tex can't handle
    for item in scientific_notation:
        word = re.sub(
            item[0] + "\{" + item[1] + "\}",
            item[0] + "\\\\times {" + item[1] + "}",
            word,
        )

    word = re.sub(
        r"\\operatorname{([^(negneg)]*)negneg}\\left\(", r"\g<1>\\left(-", word
    )
    word = re.sub(r"\\operatorname{invert}", r"\\pm ", word)
    word = re.sub(r"\+plusminus\+", "\\\\pm ", word)
    word = re.sub(r"\\operatorname{(\w)}", r"\g<1>", word)
    word = re.sub(r"zero", r"-0.", word)
    word = re.sub(r"%", "\\\\%", word)
    word = re.sub("leftt\+", "\\\\left(", word)
    word = re.sub("\+rightt", "\\\\right)", word)
    word = re.sub("primesymbol", "'", word)
    word = re.sub("°", "\\\\degree", word)
    word = re.sub("𝜃", "\\\\theta", word)
    word = re.sub("θ", "\\\\theta", word)
    word = re.sub("ε", "\\\\varepsilon", word)
    word = re.sub("λ", "\\\\lambda", word)
    word = re.sub("getsgets", " \\\\gets ", word)
    word = re.sub("dotdotdot", "...", word)
    if bracketsub:
        word = re.sub("bracketsub", "[" + bracketsub.group(1) + "]", word)

    while re.search(r"sqrt\{[^\,]+\,\s*[^\,]+\}", word):
        word = re.sub(r"sqrt\{([^\,]+)\,\s*([^\,]+)\}", r"sqrt[\g<1>]{\g<2>}", word)

    # handle trig power
    for trig in trig_operators:
        matches = re.finditer(r"{" + trig + r"\\left\(", word)
        for mat in matches:
            power_idx = find_matching(word, "{", mat.start()) + 2
            if word[power_idx] == "{":
                power = word[power_idx : find_matching(word, "{", power_idx) + 1]
            elif word[power_idx].isnumeric():
                power = re.match("[0-9\.]+", word[power_idx:]).group(0)
            else:
                power = word[power_idx]
            word = (
                word[: mat.start(0)]
                + trig
                + r"^"
                + power
                + word[mat.start() + 4 : power_idx - 2]
                + word[power_idx + len(power) :]
            )

    if sum_match:
        if not sum_upper_num:
            word = re.sub(sum_upper + "-1", sum_upper, word)
    return word[2:-2]


def find_matching(word, char, idx):
    l_count = r_count = 0
    idx += 1
    while idx < len(word):
        if word[idx] == char:
            l_count += 1
        elif word[idx] == match[char]:
            r_count += 1
        if r_count > l_count:
            return idx
        idx += 1
    raise Exception("unmatched" + char)


def handle_single_matrix(mat):
    mat = re.findall("/mat{(.+?)}", mat)[0]
    mat = re.sub(r"\),[\s]*\(", r" \\\\ ", mat)
    mat = re.sub("[\(|\)]", "", mat)
    mat = re.sub("\s*,\s*", " & ", mat)
    elements = mat.split()
    elements = [re.sub("\\\\", r"\\\\", handle_word(e)) for e in elements]
    mat = " ".join(elements)
    mat = r"\\begin{bmatrix} " + mat + r" \\end{bmatrix}"
    return mat


def handle_single_table(table):
    table = re.findall("/tab{(.+?)}", table)[0]
    l1_end = find_matching(table, "(", 0)
    num_cols = table[0:l1_end].count(",") + 1
    table = re.sub(r"\),[\s]*\(", r" \\\\ \\hline ", table)
    table = re.sub("[\(|\)]", "", table)
    table = re.sub("\s*,\s*", " & ", table)
    elements = table.split()
    elements = [re.sub("\\\\", r"\\\\", handle_word(e)) for e in elements]
    table = " ".join(elements)
    table = (
        r"\\begin{tabular} {|"
        + " c |" * num_cols
        + r"} \\hline "
        + table
        + r" \\hline \\end{tabular}"
    )
    return table


def handle_single_limit(lim):
    a = re.search("/lim{([^,]+),([^,]+),(.+)}", lim).group(1)
    b = re.search("/lim{([^,]+),([^,]+),(.+)}", lim).group(2)
    c = re.search("/lim{([^,]+),([^,]+),(.+)}", lim).group(3)
    lim_latex = (
        r"\\lim_{"
        + re.sub("\\\\", r"\\\\", handle_word(a))
        + r"\\to"
        + re.sub("\\\\", r"\\\\", handle_word(b))
        + r"} "
        + re.sub("\\\\", r"\\\\", handle_word(c))
    )
    return lim_latex


def handle_single_integral(integral):
    definite = re.search("/int{(.+),([^,]+),([^,]+),([^,]+)}", integral)
    if definite:
        func = definite.group(1)
        a = definite.group(2)
        b = definite.group(3)
        var = definite.group(4)
        int_latex = (
            r"\\int_{"
            + re.sub("\\\\", r"\\\\", handle_word(a))
            + r"}^{"
            + re.sub("\\\\", r"\\\\", handle_word(b))
            + r"} "
            + re.sub("\\\\", r"\\\\", handle_word(func))
            + r" \\,d"
            + re.sub("\\\\", r"\\\\", handle_word(var))
        )
    else:
        indefinite = re.search("/int{(.+),([^,]+)}", integral)
        func = indefinite.group(1)
        var = indefinite.group(2)
        int_latex = (
            r"\\int "
            + re.sub("\\\\", r"\\\\", handle_word(func))
            + r" \\,d"
            + re.sub("\\\\", r"\\\\", handle_word(var))
        )
    return int_latex
