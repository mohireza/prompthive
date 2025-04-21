import Latex from "react-latex-next";
import { createAvatar } from "@dicebear/core";
import {
  avataaarsNeutral,
  botttsNeutral,
  funEmoji,
  notionists,
  notionistsNeutral,
  pixelArtNeutral,
} from "@dicebear/collection";
import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import Sugar from "sugar";

// utils.js

export const areSetsEqual = (setA, setB) => {
  // Check if the sets have the same size
  if (setA.size !== setB.size) {
    return false;
  }

  // Check if every element in setA is also in setB
  for (let elem of setA) {
    if (!setB.has(elem)) {
      return false;
    }
  }

  // If all checks pass, the sets are equal
  return true;
};

export const areUnorderedListsEqual = (listA, listB) => {
  // Check if the lists have the same length
  if (listA.length !== listB.length) {
    return false;
  }

  // Convert both lists to sets to eliminate duplicates and disregard order
  const setA = new Set(listA);
  const setB = new Set(listB);

  // Use the areSetsEqual helper to check if the sets are equal
  return areSetsEqual(setA, setB);
};

export const normalizeString = (str) => {
  if (str) {
    return str.toLowerCase().trim();
  }
  return "";
};
export const generateAvatarFromSeed = (userId) => {
  return createAvatar(botttsNeutral, {
    size: 128,
    seed: `${userId}`,
  }).toDataUri();
};

export const generateNameFromSeed = (userId) => {
  return uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: "-",
    seed: `${userId}`,
  });
};
export const generateRandomString = (length) => {
  let result = "";
  while (result.length < length) {
    result += Math.random().toString(36).substring(2);
  }
  return result.substring(0, length);
};

export const getCurrentTimestamp = () => {
  return new Date().toISOString();
};

export const getFormattedTimestamp = (timestamp) => {
  var date = new Date(timestamp); // RFC 1123 is directly parsed by the Date constructor
  var relativeTime = Sugar.Date(date).relative().raw;
  return relativeTime;
};

export const convertToLatex = (inputString) => {
  console.warn(`Fall back to convertToLatex: ${inputString}`);
  // return inputString;
  inputString = formatMathExpressions(inputString);
  // return inputString;
  function replaceNestedSqrt(match, p1, offset, string) {
    // This pattern matches a `sqrt` and captures its contents
    const pattern = /sqrt\(([^()]*|\([^)]*\))\)/;

    // Function to convert to LaTeX format
    function latexify(innerExpr) {
      return `\\sqrt{${innerExpr}}`;
    }

    // Initially replace the innermost `sqrt` expression
    let replaced = match;
    while (pattern.test(replaced)) {
      replaced = replaced.replace(pattern, (m, inner) => latexify(inner));
    }

    return replaced;
  }

  const replacements = [
    { regex: /sqrt\(([^)]+)\)/g, replaceWith: replaceNestedSqrt }, // Updated to handle nested square roots
    { regex: /sqrt\(([^,]+),([^)]+)\)/g, replaceWith: "\\sqrt[$2]{$1}" }, // Square root with optional argument: sqrt(y, x)
    {
      regex:
        /\*\*(\([\w*/+-]+\)|[\d\w]+[+-]*|[+-]*[\d\w]+|[\w*/+-]+\([^()]*\))/g,
      replaceWith: (match, p1) => {
        console.log(inputString);
        console.log(match);
        console.log(p1);
        // `^{${p1.slice(0,p1.length -1)}}` +
        let returnedValue = `^{${p1}}`;
        if (p1.slice(p1.length - 1) == "+" || p1.slice(p1.length - 1) == "-") {
          returnedValue =
            `^{${p1.slice(0, p1.length - 1)}}` + p1.slice(p1.length - 1);
        }
        return returnedValue;
      },
    }, // Exponentiation: x**y
    {
      regex: /(\([^()]*\)|\b\d+|\w+)\s*\/\s*(\([^()]*\)|\w+|\d+)/g,
      replaceWith: (match, p1, p2) => {
        // match is the matched string. p2 is the 1st captured group. p3 is the 2nd captured group.
        // console.log(p2);
        // console.log(p3);
        const trimmedP1 = p1.trim();
        const trimmedP2 = p2.trim();
        return `\\frac{${trimmedP1}}{${trimmedP2}}`;
      }, // Fraction: (num) / (den)
    },

    { regex: /abs\(([^)]+)\)/g, replaceWith: "\\left| $1 \\right|" }, // Absolute value: abs(x)
    { regex: /inf/g, replaceWith: "\\infty" }, // Infinity: inf
    { regex: /([^\d])e([^\d])/g, replaceWith: "$1e$2" }, // Correcting isolated e character
    { regex: /\/mat\{([^}]+)\}/g, replaceWith: createMatrix }, // Matrix creation function
    { regex: /log\{([^}]+)\}\{([^}]+)\}/g, replaceWith: "\\log_{$1}{$2}" }, // Logarithm with base
    {
      regex: /sum\{([^}]+)\}\{([^}]+)\}\{([^}]+)\}/g,
      replaceWith: "\\sum_{$1}^{$2}{$3}", // Summation with limits
    },
    {
      regex: /\/lim\{([^,]+),([^,]+),([^}]+)\}/g,
      replaceWith: "\\lim_{$1 \\to $2} $3", // Limit
    },
    {
      regex: /\/int\{([^,]+),([^,]+),([^,]+),([^}]+)\}/g,
      replaceWith: "\\int_{$2}^{$3} $1 \\, d$4", // Definite integral with limits
    },
    { regex: /\/int\{([^,]+),([^}]+)\}/g, replaceWith: "\\int $1 \\, d$2" }, // Indefinite integral
    { regex: /(\d+)\~(\d+)/g, replaceWith: "$1 \\pm $2" }, // Plus-minus notation
    { regex: /([^<>=])([<>])([^<>=])/g, replaceWith: "$1 $2 $3" }, // Spacing around < and >
    { regex: /([^|])\|pipe\|([^>]+)>/g, replaceWith: "$1 \\mid $2 >" }, // Corrects and formats condition
    { regex: /(\b\d+|\w+|\\)\*(\b\d+|\w+|\\)/g, replaceWith: "$1 \\times $2" }, // Multiplication: x*y
  ];

  replacements.forEach((replacement) => {
    inputString = inputString.replace(
      replacement.regex,
      typeof replacement.replaceWith === "function"
        ? replacement.replaceWith
        : replacement.replaceWith
    );
  });

  console.warn(`Result: ${inputString}`);
  return inputString;
  //return <Latex>{inputString}</Latex>;
};

/**
 * @param {object} obj 
 * @returns {Boolean}
 */
export function isString(obj) {
  return typeof obj === "string" || obj instanceof String;
}

function formatMathExpressions(inputString) {
  if (!isString(inputString)) {
    return inputString;
  }

  const mathExpressionRegex = /sqrt\([^)]+\)|[*+-]+|\/+|\^+|\d+|=+/g;

  return inputString
    .split(/\s/)
    .map((word) => {
      if (mathExpressionRegex.test(word)) {
        return `$${word}$`;
      }
      return word;
    })
    .join(" ");
}

function createMatrix(matrixString) {
  const rows = matrixString
    .split(",")
    .map((row) => row.trim().split(/\s+/).join(" & "));
  return `\\begin{pmatrix} ${rows.join(" \\\\ ")} \\end{pmatrix}`;
}

export const numberToLetters = (num) => {
  let letters = "";
  while (num >= 0) {
    letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[num % 26] + letters;
    num = Math.floor(num / 26) - 1;
  }
  return letters;
};
