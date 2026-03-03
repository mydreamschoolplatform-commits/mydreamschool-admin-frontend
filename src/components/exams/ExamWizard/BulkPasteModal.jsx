import React, { useState } from 'react';
import { X, HelpCircle, Check, AlertCircle } from 'lucide-react';

const BulkPasteModal = ({ isOpen, onClose, onAddQuestions }) => {
    const [text, setText] = useState('');
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [showPreview, setShowPreview] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    if (!isOpen) return null;

    const parseText = () => {
        if (!text.trim()) return;

        // Split by typical question separators (double newline often used)
        // But some might use "1.", "2." to separate. 
        // Let's use a regex to identity the start of a new question
        // Pattern: look for "Number." or "Number)" at start of line

        const rawLines = text.split('\n').map(l => l.trim()).filter(l => l);

        const questions = [];
        let currentQ = null;

        // This is a simple state machine parser
        // It's greedy: it assumes a line starting with "A." or "a)" is an option
        // and "Ans:" or "Answer:" is the answer.

        rawLines.forEach(line => {
            // Check for new question start (e.g., "1. What is...", "2)")
            // Regex: ^\d+[\.)]\s+
            const questionStartMatch = line.match(/^(\d+)[\.)]\s+(.+)/);

            if (questionStartMatch) {
                // If we have a current question, push it
                if (currentQ) {
                    questions.push(currentQ);
                }

                // Start new question
                currentQ = {
                    questionText: questionStartMatch[2], // The text after "1. "
                    options: [],
                    correctAnswer: '',
                    rawAnswer: '', // to map later
                    type: 'MCQ'
                };
                return;
            }

            // If no current question, skip line (or maybe it's part of previous question text, but let's keep it simple)
            if (!currentQ) return;

            // Check for Option
            // Regex: ^[A-Da-d][\.)]\s+
            const optionMatch = line.match(/^([A-Da-d])[\.)]\s+(.+)/);
            if (optionMatch) {
                currentQ.options.push({
                    key: optionMatch[1].toUpperCase(),
                    value: optionMatch[2]
                });
                return;
            }

            // Check for Answer
            // Regex: ^(Ans|Answer|Correct)[:\-\s]+([A-Da-d])
            const answerMatch = line.match(/^(?:Ans|Answer|Correct)(?:[:\-\s]+)([A-Da-d])/i);
            if (answerMatch) {
                currentQ.rawAnswer = answerMatch[1].toUpperCase();
                return;
            }

            // check for simple answer letter only "D" or "d" at the end? 
            // Might be risky. Let's stick to explicit labels or maybe just "Answer: A"
        });

        // Push the last one
        if (currentQ) {
            questions.push(currentQ);
        }

        // Finalize: Map rawAnswer key to actual option value
        const finalized = questions.map(q => {
            const correctOpt = q.options.find(o => o.key === q.rawAnswer);

            // Pad options if fewer than 4 (just to be safe for UI)
            const plainOptions = q.options.map(o => o.value);
            while (plainOptions.length < 4) plainOptions.push('');

            return {
                questionText: q.questionText,
                options: plainOptions,
                correctAnswer: correctOpt ? correctOpt.value : '', // Set the TEXT value of the answer
                type: 'MCQ'
            };
        });

        setParsedQuestions(finalized);
        setShowPreview(true);
    };

    const handleConfirm = () => {
        onAddQuestions(parsedQuestions);
        onClose();
        // Reset
        setText('');
        setParsedQuestions([]);
        setShowPreview(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">Bulk Add Questions</h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                            <HelpCircle size={16} className="mr-1" /> Format Guide
                        </button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* Input Area */}
                    <div className={`flex-1 p-4 flex flex-col ${showPreview ? 'hidden md:flex md:w-1/2 md:border-r' : 'w-full'}`}>
                        {showHelp && (
                            <div className="bg-blue-50 p-3 rounded mb-3 text-sm text-blue-800 border border-blue-200">
                                <p className="font-bold mb-1">Expected Format:</p>
                                <pre className="whitespace-pre-wrap font-mono text-xs bg-white p-2 border rounded">
                                    {`1. What is the capital of France?
A. London
B. Berlin
C. Paris
D. Madrid
Answer: C

2. Next question...`}
                                </pre>
                            </div>
                        )}
                        <textarea
                            className="flex-1 w-full p-4 border rounded font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="Paste your questions here..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        <div className="mt-4">
                            <button
                                onClick={parseText}
                                disabled={!text.trim()}
                                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                Parse Questions
                            </button>
                        </div>
                    </div>

                    {/* Preview Area */}
                    {showPreview && (
                        <div className="flex-1 p-4 bg-gray-50 overflow-y-auto w-full md:w-1/2">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium text-gray-700">Preview ({parsedQuestions.length})</h3>
                                <button
                                    onClick={() => setShowPreview(false)}
                                    className="text-sm text-blue-600 md:hidden"
                                >
                                    Edit Text
                                </button>
                            </div>

                            {parsedQuestions.length === 0 ? (
                                <div className="text-center text-gray-500 mt-10">
                                    <AlertCircle className="mx-auto mb-2 text-yellow-500" />
                                    <p>No questions found. Check formatting.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {parsedQuestions.map((q, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded border shadow-sm">
                                            <div className="font-medium text-gray-800 mb-2">
                                                {idx + 1}. {q.questionText}
                                            </div>
                                            <ul className="space-y-1 text-sm text-gray-600 ml-4 list-[upper-alpha] list-inside">
                                                {q.options.map((opt, oIdx) => (
                                                    <li key={oIdx} className={opt === q.correctAnswer ? "text-green-600 font-semibold" : ""}>
                                                        {opt} {opt === q.correctAnswer && <Check size={14} className="inline ml-1" />}
                                                    </li>
                                                ))}
                                            </ul>
                                            {!q.correctAnswer && (
                                                <p className="text-xs text-red-500 mt-2">No correct answer detected.</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {showPreview && parsedQuestions.length > 0 && (
                    <div className="p-4 border-t flex justify-end bg-gray-50">
                        <button
                            onClick={handleConfirm}
                            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-medium"
                        >
                            Add {parsedQuestions.length} Questions
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BulkPasteModal;
