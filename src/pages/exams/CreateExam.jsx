import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, ArrowRight, Save, Upload, AlertTriangle } from 'lucide-react';
import { examService } from '../../api/examService';
import StepBasics from '../../components/exams/ExamWizard/StepBasics';
import StepAudience from '../../components/exams/ExamWizard/StepAudience';
import StepScheduling from '../../components/exams/ExamWizard/StepScheduling';
import StepContent from '../../components/exams/ExamWizard/StepContent';
import StepQuestions from '../../components/exams/ExamWizard/StepQuestions';

const CreateExam = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const sourceId = searchParams.get('source'); // For Duplication
    const editId = searchParams.get('edit');     // For Editing

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [subjects, setSubjects] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        instructions: '',
        subject: '',
        section: '',
        patternType: '', // 1-6
        language: 'English',
        duration: 60,
        scopes: {
            classes: [],
            medium: ['English'], // Default
            schools: ['Global'] // Default
        },
        startTime: '',
        patternSourceUrl: '',
        questions: [],
        // Internal tracking
        parentExamId: null,
        version: 1,
    });

    useEffect(() => {
        fetchSubjects();
        if (editId) {
            fetchSourceExam(editId, true); // Edit Mode
        } else if (sourceId) {
            fetchSourceExam(sourceId, false); // Duplicate Mode
        }
    }, [sourceId, editId]);

    // ... fetchSubjects ...

    const fetchSubjects = async () => {
        try {
            const data = await examService.getSubjects();

            // Filter for Teachers
            if (user?.role === 'Teacher') {
                const assignedIds = user.assignedSubjects?.map(s => s.subjectId) || [];
                const filtered = data.filter(s => assignedIds.includes(s._id || s.id));
                setSubjects(filtered);
            } else {
                setSubjects(data);
            }
        } catch (err) {
            console.error("Failed to fetch subjects");
        }
    };

    const fetchSourceExam = async (id, isEditMode) => {
        try {
            const exam = await examService.getExamById(id);
            // Populate form data
            setFormData({
                title: isEditMode ? exam.title : `${exam.title} (v${(exam.version || 1) + 1})`,
                instructions: exam.instructions || '',
                subject: exam.subject?._id || exam.subject, // Handle populated
                section: exam.section,
                patternType: exam.patternType,
                language: 'English', // Default or fetch if exists
                duration: exam.duration,
                scopes: exam.scopes || { classes: [], medium: [], schools: [] },
                startTime: exam.startTime || '', // Edit: Keep time. Duplicate: Reset? Maybe keep for clone.
                patternSourceUrl: exam.patternSourceUrl,
                questions: exam.questions || [],
                parentExamId: isEditMode ? null : exam._id, // Only for versioning
                version: isEditMode ? exam.version : (exam.version || 1) + 1,
                attemptCount: exam.attemptCount || 0 // Set from API
            });
        } catch (err) {
            console.error("Failed to load source exam", err);
        }
    };

    const updateData = (field, value) => {
        setFormData(prev => {
            // Handle nested updates for scopes
            if (field.startsWith('scopes.')) {
                const scopeField = field.split('.')[1];
                return {
                    ...prev,
                    scopes: {
                        ...prev.scopes,
                        [scopeField]: value
                    }
                };
            }
            return { ...prev, [field]: value };
        });
    };

    const validateStep = (step) => {
        if (step === 1) {
            return formData.title && formData.subject && formData.section && formData.patternType;
        }
        if (step === 2) {
            return formData.scopes.classes.length > 0 && formData.scopes.medium.length > 0;
        }
        if (step === 3) {
            // Start Time is optional if Draft? No, let's keep it required for simplicity or check if published.
            // If saving as draft, validation might be skipped or looser.
            // But let's keep current logic: required.
            return formData.startTime;
        }
        if (step === 4) {
            // Validation depends on pattern.
            if (['1', '2', '3'].includes(String(formData.patternType))) {
                return !!formData.patternSourceUrl;
            }
            return true;
        }
        if (step === 5) {
            return formData.questions.length > 0 && formData.questions.every(q => q.questionText && q.correctAnswer);
        }
        return true;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
        } else {
            alert("Please fill all required fields.");
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
    };

    const getPatternEnum = (type) => {
        const map = {
            '1': 'Video_MCQ',
            '2': 'Story_MCQ',
            '3': 'Image_MCQ',
            '4': 'Direct_MCQ',
            '5': 'Fill_Blanks',
            '6': 'Written'
        };
        return map[String(type)] || 'Direct_MCQ';
    };

    const handleSubmit = async (isPublished) => {
        if (isPublished && !validateStep(5)) {
            alert("To publish, please add at least one question with valid text and correct answer.");
            return;
        }
        if (!isPublished && formData.questions.length > 0 && !validateStep(5)) {
            alert("Please ensure all added questions are valid.");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...formData,
                pattern: getPatternEnum(formData.patternType),
                isPublished
            };

            if (editId) {
                await examService.updateExam(editId, payload);
            } else {
                await examService.createExam(payload);
            }

            // Show success message (optional, could use a toast)
            // alert(isPublished ? 'Exam published successfully!' : 'Exam saved as draft.');

            navigate('/exams');
        } catch (err) {
            console.error(err);
            alert('Failed to save exam. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
                {editId ? 'Edit Exam' : (sourceId ? 'Create New Version' : 'Create New Exam')}
            </h1>

            {/* Editing Warning */}
            {editId && formData.attemptCount > 0 && (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-bold text-amber-800 text-sm uppercase mb-1">Warning: Active Attempts Detected</h4>
                        <p className="text-sm text-amber-700 leading-relaxed">
                            This exam has already been attempted by <strong>{formData.attemptCount} students</strong>.
                            Editing it will change the grading criteria for future attempts but may not retroactively update past scores, leading to inconsistency.
                        </p>
                        <div className="mt-3 flex gap-3">
                            <button
                                onClick={() => {
                                    // Navigate to Duplicate instead
                                    navigate(`/exams/create?source=${editId}`);
                                }}
                                className="text-xs font-bold bg-white text-amber-800 px-3 py-1.5 rounded border border-amber-300 hover:bg-amber-100 shadow-sm transition-colors"
                            >
                                Copy to New Version (Recommended)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stepper */}
            <div className="flex items-center justify-between mb-8">
                {[1, 2, 3, 4, 5].map(step => (
                    <div key={step} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === currentStep ? 'bg-blue-600 text-white' :
                            step < currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                            {step < currentStep ? '✓' : step}
                        </div>
                        {step < 5 && <div className={`h-1 w-12 mx-2 ${step < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 min-h-[400px]">
                {currentStep === 1 && <StepBasics data={formData} updateData={updateData} subjects={subjects} />}
                {currentStep === 2 && <StepAudience data={formData} updateData={updateData} />}
                {currentStep === 3 && <StepScheduling data={formData} updateData={updateData} />}
                {currentStep === 4 && <StepContent data={formData} updateData={updateData} />}
                {currentStep === 5 && <StepQuestions data={formData} updateData={updateData} />}
            </div>

            {/* Footer Controls */}
            <div className="flex justify-between mt-6">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 1}
                    className={`px-4 py-2 rounded border ${currentStep === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
                >
                    Back
                </button>

                <div className="space-x-4">
                    {currentStep < 5 ? (
                        <button
                            onClick={handleNext}
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                        >
                            Next <ArrowRight size={16} className="ml-2" />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => handleSubmit(false)}
                                disabled={loading}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                            >
                                Save as Draft
                            </button>
                            <button
                                onClick={() => handleSubmit(true)}
                                disabled={loading}
                                className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center inline-flex"
                            >
                                <Save size={16} className="mr-2" /> Publish Exam
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateExam;
