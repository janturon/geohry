function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

class Question {

    constructor({
        name,
        type,
        question,
        image,
        template,
        messages
    }) {

        let parsedTemplate;

		if (type === "choice") {

			//parsuje choice odpovedi
			parsedTemplate = parseChoiceAnswers(template);

		} else {

			//number, text
			parsedTemplate = {
				type,
				template: {
					correctAnswer: template,
					label: ""
				}
			};

		}

        this.template = {
            parsed: parsedTemplate.template,
            original: template
        };

        this.question = {
            name,
            type: {
                original: type,
                parsed: parsedTemplate.type
            },
            q: question,
            image
        };

        Object.assign(this, {
            elem: null,
            receivedAnswers: [],
            messages
        });

        return this;

    }

    checkAnswer({
        wrong,
        correct
    }) {

        const qType = this.question.type;
        let correctlyAnswered = true;

        switch (qType) {

            case 'radio':
            case 'checkbox':

                this.elem.forEach((el, i) => {

                    if (el.children[0].checked != this.template[i].correctAnswer) {

                        correctlyAnswered = false;
                        return;

                    }

                });

                break;

            case 'text':
            case 'number':

                if (this.elem.value != this.template.correctAnswer) {

                    correctlyAnswered = false;

                }

                break;

        }

        if (correctlyAnswered) {

            correct.bind(this)();

        } else {

            wrong.bind(this)();

        }

        return this;

    }

    saveToLocalStorage(what = null) {

        const qName = this.question.name;

        if (what !== null) {

            const loadedQ = Question.loadQuestionFromLocalStorage(qName, () => this);

            Object.assign(loadedQ, what);

            localStorage.setItem(qName, JSON.stringify(loadedQ));

            return this;

        }

        localStorage.setItem(qName, JSON.stringify(this));

        return this;

    }

    static loadQuestionFromLocalStorage(key, setterCallback) {

        const obtainedData = localStorage.getItem(key);
        const that = this;

        if (obtainedData === null) {

            return setterCallback();

        }

        const parsedObtainedData = JSON.parse(obtainedData);

        const newQ = new that({
            type: parsedObtainedData.question.type.original,
            question: parsedObtainedData.question.q,
            image: parsedObtainedData.question.image,
            name: parsedObtainedData.question.name,
            template: parsedObtainedData.template.original,
            messages: parsedObtainedData.messages
        });

        newQ.receivedAnswers = parsedObtainedData.receivedAnswers;

        return newQ;

    }

    removeFromLocalStorage() {

        localStorage.removeItem(this.question.name);

        return this;

    }

    loadItemsFromLocalStorage(...items) {

        const res = {};

        const loadedQ = Question.loadQuestionFromLocalStorage(this.question.name, () => this);

        for (const key of items) {

            res[key] = loadedQ[key];

        }

        return res;

    }

    addAnswer(ans) {

        let answersBefore = this.loadItemsFromLocalStorage('receivedAnswers').receivedAnswers;
        answersBefore = [...answersBefore, ans];

        this.saveToLocalStorage({
            receivedAnswers: answersBefore
        });

        return this;

    }

    renderQuestion() {

        const qType = this.question.type;

        const requireLabelEl = (type, end) => (
            type === 'radio' || type === 'checkbox' ? `<${ end ? '/' : '' }label>` : ''
        );

        const template = new Renderer((type, labelText, group = '') => `${ requireLabelEl(type, false) }<input type="${ type }" name="${ group }" placeholder="${ labelText }">${ type === 'radio' || type === 'checkbox' ? labelText : '' }${ requireLabelEl(type, true) }`);

        switch (qType) {

            case 'text':
            case 'number':
                
                const dom = template(qType, this.template.label || '');

                return dom;

            break;

        case 'radio':
        case 'checkbox':

            this.elem = [];
            const frag = document.createDocumentFragment();

            for (const pieceOfTemplate of this.template) {

                const dom = template(qType, pieceOfTemplate.label, this.question.name);

                frag.appendChild(dom);

                this.elem.push(dom);

            }

            return frag;

        break;

        }

    }

    renderImage(fallback = "") {

        const image = this.question.image;

        if (image.src) {

            const img = document.createElement('img');
            img.style.objectFit = 'contain';
            img.style.width = `${ image.w }px`;
            img.style.height = `${ image.h }px`;
            img.src = image.src;

            return img;

        }

        return fallback;

    }

}

class Renderer {

    constructor(renderFunc) {

        return function (...params) {

            const strTemplate = renderFunc(...params);
            const template = document.createElement('template');
            template.innerHTML = strTemplate;

            return template.content.children[0];

        }

    }

}

function parseChoiceAnswers(inputValueString) {

    const captureAnswersRegex = /\s*([\*]?[a-zA-Z0-9_\?\!\, ]+)\;/g;
    const correctAnsRegex = /\*([a-zA-Z0-9_\?\!\, ]+)/;
    let match;
    const captureMatches = [];
    while (match = captureAnswersRegex.exec(inputValueString)) {

        captureMatches.push(match[1]);

    }

    const parsedAnswers = [];
    let correctAnswersCount = 0;

    for (const ans of captureMatches) {

        const isCorrect = ans.match(correctAnsRegex);

        if (isCorrect !== null) {

            parsedAnswers.push({
                label: isCorrect[1],
                correctAnswer: true
            });

            correctAnswersCount++;

        } else {

            parsedAnswers.push({
                label: ans,
                correctAnswer: false
            });

        }
    }

    return {
        type: correctAnswersCount > 1 ? 'checkbox' : 'radio',
        template: parsedAnswers
    };

}