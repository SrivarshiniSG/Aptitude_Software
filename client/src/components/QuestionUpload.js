import React, { useState } from 'react';
import api from '../axios/axios';
import '../styles/QuestionUpload.css';

export default function QuestionUpload() {
  const [selectedQuestionType, setSelectedQuestionType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [hasImage, setHasImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    image: null
  });
  const [comprehensionData, setComprehensionData] = useState({
    passage: '',
    q1: { question: '', options: ['', '', '', ''], correctAnswer: 0 },
    q2: { question: '', options: ['', '', '', ''], correctAnswer: 0 },
    q3: { question: '', options: ['', '', '', ''], correctAnswer: 0 },
    q4: { question: '', options: ['', '', '', ''], correctAnswer: 0 },
    q5: { question: '', options: ['', '', '', ''], correctAnswer: 0 }
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Define category options for each question type
  const categoryOptions = {
    aptitude: [
      'ac1',
      'ac2',
      'ac3',
      'ac4',
      'ac5',
      'ac6',
      'ac7',
      'ac8',
      'ac9',
      'ac10'
    ],
    verbal: [
      'vc1',
      'vc2',
      'vc3',
      'vc4',
      'vc5',
      'vc6',
      'vc7',
      'vc8',
      'vc9',
      'vc10'
    ],
    programming: [
      'pc1',
      'pc2',
      'pc3',
      'pc4',
      'pc5',
      'pc6',
      'pc7',
      'pc8',
      'pc9',
      'pc10',
      'pc11'
    ],
    core: [
      'cs',
      'it',
      'ec',
      'ee',
      'mech',
      'civil',
      'chem',
      'bio',
      'aids',
      'auto',
      'marine'
    ] 
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log('Selected image:', file);
      setNewQuestion(prev => ({...prev, image: file}));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      let formData = new FormData();

      if (selectedQuestionType === 'comprehension') {
        formData.append('passage', comprehensionData.passage);
        ['q1', 'q2', 'q3', 'q4', 'q5'].forEach(q => {
          formData.append(`${q}.question`, comprehensionData[q].question);
          comprehensionData[q].options.forEach((option, index) => {
            formData.append(`${q}.options[${index}]`, option);
          });
          formData.append(`${q}.correctAnswer`, comprehensionData[q].correctAnswer);
        });
        if (hasImage && newQuestion.image) {
          formData.append('image', newQuestion.image);
        }

        const response = await api.post('/api/comprehension', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        console.log('Comprehension upload response:', response.data);
        setSuccess('Comprehension question set added successfully!');
        setComprehensionData({
          passage: '',
          q1: { question: '', options: ['', '', '', ''], correctAnswer: 0 },
          q2: { question: '', options: ['', '', '', ''], correctAnswer: 0 },
          q3: { question: '', options: ['', '', '', ''], correctAnswer: 0 },
          q4: { question: '', options: ['', '', '', ''], correctAnswer: 0 },
          q5: { question: '', options: ['', '', '', ''], correctAnswer: 0 }
        });
      } else {
        formData.append('category', selectedQuestionType);
        if (selectedQuestionType === 'core') {
          formData.append('subCategory', selectedCategory);
        }
        formData.append('question', newQuestion.question);
        newQuestion.options.forEach((option, index) => {
          formData.append(`options[${index}]`, option);
        });
        formData.append('correctAnswer', newQuestion.correctAnswer);
        if (hasImage && newQuestion.image) {
          formData.append('image', newQuestion.image);
        }

        const response = await api.post('/api/questions', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        console.log('Question upload response:', response.data);
        setSuccess('Question added successfully!');
        setNewQuestion({
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0,
          image: null
        });
      }
      setSelectedCategory('');
      setHasImage(false);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || 'Error adding question');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComprehensionChange = (questionNumber, field, value, optionIndex) => {
    setComprehensionData(prev => {
      const newData = { ...prev };
      if (field === 'option') {
        newData[questionNumber].options[optionIndex] = value;
      } else {
        newData[questionNumber][field] = value;
      }
      return newData;
    });
  };

  // Image checkbox handler
  const handleImageCheckbox = (e) => {
    setHasImage(e.target.checked);
    if (!e.target.checked) {
      setNewQuestion(prev => ({...prev, image: null}));
    }
  };

  return (
    <div className='qu-container'>
      <form onSubmit={handleSubmit} className="qu-question-form">
        {/* Question Type Selection */}
        <div className="qu-form-group">
          <select 
            value={selectedQuestionType}
            onChange={(e) => {
              setSelectedQuestionType(e.target.value);
              setSelectedCategory('');
              setHasImage(false);
            }}
            required
            className="qu-select-input"
          >
            <option value="">Select Question Type</option>
            <option value="aptitude">Aptitude</option>
            <option value="verbal">Verbal</option>
            <option value="programming">Programming</option>
            <option value="core">Core</option>
            <option value="comprehension">Comprehension</option>
          </select>
        </div>

        {selectedQuestionType === 'comprehension' ? (
          <>
            {/* Passage Input */}
            <div className="qu-form-group">
              <textarea
                placeholder="Enter passage"
                value={comprehensionData.passage}
                onChange={(e) => setComprehensionData(prev => ({ ...prev, passage: e.target.value }))}
                required
                className="qu-question-input"
                style={{ minHeight: '200px' }}
              />
            </div>

            {/* Sub-questions */}
            {['q1', 'q2', 'q3', 'q4', 'q5'].map((q, qIndex) => (
              <div key={q} className="qu-sub-question">
                <h3>Question {qIndex + 1}</h3>
                <div className="qu-form-group">
                  <textarea
                    placeholder={`Enter question ${qIndex + 1}`}
                    value={comprehensionData[q].question}
                    onChange={(e) => handleComprehensionChange(q, 'question', e.target.value)}
                    required
                    className="qu-question-input"
                  />
                </div>

                {comprehensionData[q].options.map((option, index) => (
                  <div key={index} className="qu-form-group">
                    <input
                      type="text"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => handleComprehensionChange(q, 'option', e.target.value, index)}
                      required
                      className="qu-option-input"
                    />
                  </div>
                ))}

                <div className="qu-form-group">
                  <select
                    value={comprehensionData[q].correctAnswer}
                    onChange={(e) => handleComprehensionChange(q, 'correctAnswer', Number(e.target.value))}
                    required
                    className="qu-select-input"
                  >
                    <option value="">Select Correct Answer</option>
                    {comprehensionData[q].options.map((_, index) => (
                      <option key={index} value={index}>Option {index + 1}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            {/* Image Upload for Comprehension */}
            <div className="qu-form-group">
              <label className="qu-checkbox-label">
                <input
                  type="checkbox"
                  checked={hasImage}
                  onChange={handleImageCheckbox}
                  className="qu-checkbox-input"
                />
                Add an image to the passage
              </label>
            </div>

            {hasImage && (
              <div className="qu-form-group">
                <label className="qu-file-input-label">
                  {newQuestion.image ? 'Change Image' : 'Add Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="qu-file-input"
                    required={hasImage}
                  />
                </label>
                {newQuestion.image && (
                  <div className="qu-image-preview">
                    <div className="qu-image-info">
                      <p>Selected file: {newQuestion.image.name}</p>
                      <p>Size: {(newQuestion.image.size / 1024).toFixed(2)} KB</p>
                      <p>Type: {newQuestion.image.type}</p>
                    </div>
                    <img 
                      src={URL.createObjectURL(newQuestion.image)} 
                      alt="Question preview" 
                      style={{ maxWidth: '200px', marginTop: '10px' }}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Category Selection for Core */}
            {selectedQuestionType === 'core' && (
              <div className="qu-form-group">
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  required
                  className="qu-select-input"
                >
                  <option value="">Select Category</option>
                  {categoryOptions[selectedQuestionType].map((category) => (
                    <option key={category} value={category}>
                      {category.replace(/_/g, ' ').toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Image Question Checkbox */}
            <div className="qu-form-group">
              <label className="qu-checkbox-label">
                <input
                  type="checkbox"
                  checked={hasImage}
                  onChange={handleImageCheckbox}
                  className="qu-checkbox-input"
                />
                This is an image question
              </label>
            </div>

            {/* Question Input */}
            <div className="qu-form-group">
              <textarea
                placeholder="Enter question"
                value={newQuestion.question}
                onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                required
                className="qu-question-input"
              />
            </div>

            {/* Options Input */}
            {newQuestion.options.map((option, index) => (
              <div key={index} className="qu-form-group">
                <input
                  type="text"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...newQuestion.options];
                    newOptions[index] = e.target.value;
                    setNewQuestion({...newQuestion, options: newOptions});
                  }}
                  required
                  className="qu-option-input"
                />
              </div>
            ))}

            {/* Correct Answer Selection */}
            <div className="qu-form-group">
              <select
                value={newQuestion.correctAnswer}
                onChange={(e) => setNewQuestion({...newQuestion, correctAnswer: Number(e.target.value)})}
                required
                className="qu-select-input"
              >
                <option value="">Select Correct Answer</option>
                {newQuestion.options.map((_, index) => (
                  <option key={index} value={index}>Option {index + 1}</option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            {hasImage && (
              <div className="qu-form-group">
                <label className="qu-file-input-label">
                  {newQuestion.image ? 'Change Image' : 'Add Image'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="qu-file-input"
                    required={hasImage}
                  />
                </label>
                {newQuestion.image && (
                  <div className="qu-image-preview">
                    <div className="qu-image-info">
                      <p>Selected file: {newQuestion.image.name}</p>
                      <p>Size: {(newQuestion.image.size / 1024).toFixed(2)} KB</p>
                      <p>Type: {newQuestion.image.type}</p>
                    </div>
                    <img 
                      src={URL.createObjectURL(newQuestion.image)} 
                      alt="Question preview" 
                      style={{ maxWidth: '200px', marginTop: '10px' }}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {error && <div className="qu-error-message">{error}</div>}
        {success && <div className="qu-success-message">{success}</div>}

        <button 
          type="submit" 
          className={`qu-submit-btn ${isLoading ? 'qu-submit-btn-loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Adding Question...' : 'Add Question'}
        </button>
      </form>
    </div>
  );
}
