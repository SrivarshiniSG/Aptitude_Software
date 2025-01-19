import React, { useState, useEffect } from 'react';
import '../styles/QuestionNavigation.css';

export default function QuestionNavigation({ questions, currentQuestionIndex, onQuestionClick }) {
    const [answeredQuestions, setAnsweredQuestions] = useState([]);

    useEffect(() => {
        // Load quiz state from session storage
        const savedQuizState = sessionStorage.getItem('quizState');
        if (savedQuizState) {
            const { results } = JSON.parse(savedQuizState);
            console.log(results);
            setAnsweredQuestions(results);
        }
    }, [currentQuestionIndex]); // Update when current question changes

    // Return null if no questions are loaded
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return null;
    }

    const categories = {
        aptitude: { start: 0, end: 9 },
        core: { start: 10, end: 29 },
        verbal: { start: 30, end: 34 },
        comprehension: { start: 35, end: 39 },
        programming: { start: 40, end: 49 }
    };

    const getCategoryStatus = (category) => {
        const { start, end } = categories[category];
        const total = end - start + 1;
        const answered = answeredQuestions
            .slice(start, end + 1)
            .filter(r => r !== undefined && r !== null)
            .length;
        return { total, answered };
    };

    const getQuestionStatus = (index) => {
        if (index === currentQuestionIndex) return 'current';
        if (answeredQuestions[index] !== undefined && answeredQuestions[index] !== null) return 'answered';
        return 'unanswered';
    };

    const categoryData = {
        aptitude: { 
            name: 'Aptitude', 
            start: categories.aptitude.start, 
            end: categories.aptitude.end 
        },
        core: { 
            name: 'Core', 
            start: categories.core.start, 
            end: categories.core.end 
        },
        verbal: { 
            name: 'Verbal', 
            start: categories.verbal.start, 
            end: categories.verbal.end 
        },
        comprehension: {
            name: 'Comprehension',
            start: categories.comprehension.start,
            end: categories.comprehension.end
        },
        programming: { 
            name: 'Programming', 
            start: categories.programming.start, 
            end: categories.programming.end 
        }
    };

    return (
        <div className="question-navigation">
            {Object.entries(categoryData).map(([category, { name, start, end }]) => {
                const status = getCategoryStatus(category);
                return (
                    <div key={category} className="category-section">
                        <div className="category-header">
                            <h3>{name}</h3>
                            <span className="question-count">
                                {status.answered}/{status.total}
                            </span>
                        </div>
                        <div className="question-grid">
                            {Array.from({ length: end - start + 1 }, (_, i) => {
                                const questionIndex = start + i;
                                return (
                                    <button
                                        key={questionIndex}
                                        className={`question-button ${getQuestionStatus(questionIndex)}`}
                                        onClick={() => onQuestionClick(questionIndex)}
                                    >
                                        {questionIndex + 1}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
