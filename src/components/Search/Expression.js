const PRECEDENCE = {
    '!': 3,
    '&': 2,
    '|': 1,
    '(': 0,
    ')': 0
};

const tokenize = (expression) => {
    const tokens = [];
    let current = '';
    let i = 0;

    const pushTagToken = () => {
        if (current) {
            tokens.push(current);
            current = '';
        }
    };

    while (i < expression.length) {
        const char = expression[i];

        if (char === ' ') {
            pushTagToken();
            i++;
            continue;
        }

        if (['&', '|', '!', '(', ')'].includes(char)) {
            pushTagToken();
            tokens.push(char);
            i++;
            continue;
        }

        current += char;
        i++;
    }

    if (current) {
        tokens.push(current);
    }

    return tokens;
};

// 中缀表达式转后缀表达式（逆波兰表示法）
const infixToPostfix = (tokens) => {
    const output = [];
    const operators = [];

    for (const token of tokens) {
        if (token === '(') {
            operators.push(token);
        } else if (token === ')') {
            // 括号优先级
            while (operators.length && operators[operators.length - 1] !== '(') {
                output.push(operators.pop());
            }
            operators.pop(); // 弹出左括号
        } else if (['&', '|', '!'].includes(token)) {
            // 运算符优先级
            while (
                operators.length &&
                PRECEDENCE[operators[operators.length - 1]] >= PRECEDENCE[token]
            ) {
                output.push(operators.pop());
            }
            operators.push(token);
        } else {
            // 标签名称，作为操作数在后缀表达式中是最先出现的
            output.push(token);
        }
    }

    while (operators.length) {
        output.push(operators.pop());
    }

    return output;
};

const evaluatePostfix = (postfix, postTags) => {
    const postTagsLower = postTags.map(t => t.toLowerCase());
    const stack = [];

    for (const token of postfix) {
        if (token === '!') {
            const operand = stack.pop();
            stack.push(!operand);
        } else if (token === '&') {
            const right = stack.pop();
            const left = stack.pop();
            stack.push(left && right);
        } else if (token === '|') {
            const right = stack.pop();
            const left = stack.pop();
            stack.push(left || right);
        } else {
            // 操作数：标签名称
            stack.push(postTagsLower.includes(token.toLowerCase()));
        }
    }

    return stack[0];
};

const validateExpression = (expression, allTags) => {
    const tokens = tokenize(expression);
    const allTagsLower = allTags.map(t => t.toLowerCase());

    // 检查括号匹配
    let parenCount = 0;
    for (const token of tokens) {
        if (token === '(') parenCount++;
        if (token === ')') parenCount--;
        if (parenCount < 0) throw new Error('括号不匹配：有多余的右括号');
    }
    if (parenCount > 0) throw new Error('括号不匹配：有多余的左括号');

    // 检查标签有效性
    const invalidTags = tokens.filter(
        token => !['&', '|', '!', '(', ')'].includes(token) &&
            !allTagsLower.includes(token.toLowerCase())
    );

    if (invalidTags.length > 0) {
        throw new Error(`无效的标签: ${invalidTags.join(', ')}`);
    }

    return true;
};

export const evaluateExpression = (expression, postTags, allTags) => {
    try {
        validateExpression(expression, allTags);
        const tokens = tokenize(expression);
        console.log('Tokens:', tokens);
        const postfix = infixToPostfix(tokens);
        console.log('Postfix:', postfix);
        return evaluatePostfix(postfix, postTags);
    } catch (error) {
        console.error('表达式评估错误:', error);
        return false;
    }
};