import React from 'react';

const StepContent = ({ data, updateData }) => {
    const handleChange = (e) => {
        updateData(e.target.name, e.target.value);
    };

    const renderContentInputs = () => {
        const type = String(data.patternType);

        // 1: Video + MCQ
        if (type === '1') {
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700">YouTube Video URL / ID</label>
                    <input
                        type="text"
                        name="patternSourceUrl"
                        value={data.patternSourceUrl || ''}
                        onChange={handleChange}
                        placeholder="https://youtube.com/watch?v=..."
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    />
                </div>
            );
        }

        // 2: Story + MCQ
        if (type === '2') {
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Story Text</label>
                    <textarea
                        name="patternSourceUrl" // Reusing this field for story text? Or does backend expect Content ID? 
                        // Backend 'patternSourceUrl' is string. So usually ID or URL. 
                        // If Story is huge, storing in 'patternSourceUrl' is bad design but "Use backend exactly as is".
                        // Or maybe we create a Content first and link it?
                        // Requirement: "Video URL / Story text / Image upload".
                        // "Hide irrelevant inputs".
                        // If we put text here, it might be too long for URL field.
                        // But for now, I'll bind it here.
                        value={data.patternSourceUrl || ''}
                        onChange={handleChange}
                        rows={6}
                        placeholder="Enter the story here..."
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    />
                </div>
            );
        }

        // 3: Image + MCQ
        if (type === '3') {
            return (
                <div>
                    <label className="block text-sm font-medium text-gray-700">Image URL</label>
                    <input
                        type="text"
                        name="patternSourceUrl"
                        value={data.patternSourceUrl || ''}
                        onChange={handleChange}
                        placeholder="https://example.com/image.jpg"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm p-2 border"
                    />
                    {/* Image Upload would go here ideally. For Phase 1, using URL per plan simplicity or if Upload API exists */}
                    <p className="text-xs text-gray-500 mt-1">Direct upload not integrated yet. Please use hosted URL.</p>
                </div>
            );
        }

        // 4: Direct MCQ, 5: Fill Blanks, 6: Written
        return (
            <div className="text-gray-500 italic">
                No reference content required for this pattern type.
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Step 4: Reference Content</h3>
            {renderContentInputs()}
        </div>
    );
};

export default StepContent;
