import { useState } from 'react'
import Head from 'next/head'
import { questions, foxQuote, Question } from '../data/quizData'

// Configuration for questions per level - easy to adjust for future expansion
const QUESTIONS_PER_LEVEL: Record<'beginner' | 'mid', number> = {
  beginner: 5,
  mid: 7,
}

// Helper function to shuffle an array (Fisher-Yates algorithm)
// This ensures each session feels different and unpredictable
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Select and randomize questions from all levels
// This function runs only once when the quiz session starts
// It combines questions from each level according to QUESTIONS_PER_LEVEL config
function getRandomizedQuestions(): Question[] {
  const selectedQuestions: Question[] = []
  
  // Process each level in order: beginner first, then mid
  for (const level of ['beginner', 'mid'] as const) {
    // Filter questions by level
    const levelQuestions = questions.filter(q => q.level === level)
    
    // Shuffle the questions for this level
    const shuffled = shuffleArray(levelQuestions)
    
    // Select the required number of questions for this level
    const count = QUESTIONS_PER_LEVEL[level]
    const selected = shuffled.slice(0, count)
    
    selectedQuestions.push(...selected)
  }
  
  // Return questions in order: beginner first (5 questions), then mid (7 questions)
  // No final shuffle - keep levels separate
  return selectedQuestions
}

export default function Home() {
  // Initialize randomized questions only once using function initializer
  // This prevents reshuffling on re-render
  // Each session will have: 5 beginner + 7 mid = 12 total questions
  const [sessionQuestions] = useState<Question[]>(() => getRandomizedQuestions())
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<'left' | 'right' | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState(false)
  const [completedLevel, setCompletedLevel] = useState<'beginner' | 'mid' | null>(null)

  const currentQuestion = sessionQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === sessionQuestions.length - 1
  
  // Questions are ordered: first 5 are beginner (indices 0-4), next 7 are mid (indices 5-11)
  const BEGINNER_QUESTIONS_COUNT = QUESTIONS_PER_LEVEL.beginner
  const isLastBeginnerQuestion = currentQuestionIndex === BEGINNER_QUESTIONS_COUNT - 1
  const isLastMidQuestion = currentQuestionIndex === sessionQuestions.length - 1

  const handleSelect = (side: 'left' | 'right') => {
    if (!showExplanation) {
      setSelectedAnswer(side)
      setShowExplanation(true)
    }
  }

  const handleNext = () => {
    // Check if we just completed the beginner level (after question 5, index 4)
    if (isLastBeginnerQuestion) {
      setCompletedLevel('beginner')
      setShowLevelCompleteModal(true)
      return
    }
    
    // Check if we just completed the mid level (after question 12, index 11)
    if (isLastMidQuestion) {
      setCompletedLevel('mid')
      setShowLevelCompleteModal(true)
      return
    }
    
    // Move to next question
    setCurrentQuestionIndex(currentQuestionIndex + 1)
    setSelectedAnswer(null)
    setShowExplanation(false)
  }

  const handleProceedToNextLevel = () => {
    setShowLevelCompleteModal(false)
    setCompletedLevel(null)
    
    if (isLastQuestion) {
      // Reset to first question if we completed the entire quiz
      setCurrentQuestionIndex(0)
    } else {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
    setSelectedAnswer(null)
    setShowExplanation(false)
  }

  const isCorrect = selectedAnswer === currentQuestion.correctAnswer

  return (
    <>
      <Head>
        <title>Design Quiz</title>
        <meta name="description" content="A simple design quiz app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins&display=swap" rel="stylesheet" />
      </Head>
      <main className="min-h-screen bg-white px-6 py-12 md:px-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <div className="text-xl md:text-2xl font-medium text-black mb-8 tracking-normal" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '0.02em' }}>
              Design Gym
            </div>
            <div className="mb-4">
              <div className="text-sm text-gray-500 mb-2">
                Question {currentQuestionIndex + 1} of {sessionQuestions.length}
              </div>
              <div className="w-full bg-gray-200 h-2 max-w-md mx-auto">
                <div 
                  className="bg-black h-2 transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / sessionQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-normal text-center mb-8 text-gray-900">
              {currentQuestion.question}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div
              onClick={() => handleSelect('left')}
              className={`cursor-pointer transition-all relative group ${currentQuestion.type === 'font'
                  ? ''
                  : `border-2 ${selectedAnswer === 'left'
                    ? isCorrect
                      ? 'border-green-500'
                      : 'border-red-500'
                    : showExplanation && currentQuestion.correctAnswer === 'left'
                      ? 'border-green-500'
                      : 'border-gray-200 hover:border-gray-400'
                  }`
                }`}
            >
              {currentQuestion.type === 'font' ? (
                <div
                  className={`p-8 min-h-[300px] flex items-center justify-center bg-white transition-transform ${!showExplanation ? 'group-hover:scale-[1.02]' : ''
                    }`}
                  style={{ fontFamily: currentQuestion.leftFont }}
                >
                  <p className="text-3xl leading-relaxed text-center">
                    {foxQuote}
                  </p>
                </div>
              ) : currentQuestion.leftImage ? (
                <img
                  src={currentQuestion.leftImage}
                  alt="Design option A"
                  className={`w-full h-auto transition-transform ${!showExplanation ? 'group-hover:scale-[1.02]' : ''
                    }`}
                />
              ) : null}
              {!showExplanation && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-start justify-center pt-4">
                  <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Click to select
                  </span>
                </div>
              )}
              {selectedAnswer === 'left' && (
                <div className={`p-4 text-center font-medium ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                  {isCorrect ? '✓ Correct' : '✗ Your choice'}
                </div>
              )}
            </div>

            <div
              onClick={() => handleSelect('right')}
              className={`cursor-pointer transition-all relative group ${currentQuestion.type === 'font'
                  ? ''
                  : `border-2 ${selectedAnswer === 'right'
                    ? isCorrect
                      ? 'border-green-500'
                      : 'border-red-500'
                    : showExplanation && currentQuestion.correctAnswer === 'right'
                      ? 'border-green-500'
                      : 'border-gray-200 hover:border-gray-400'
                  }`
                }`}
            >
              {currentQuestion.type === 'font' ? (
                <div
                  className={`p-8 min-h-[300px] flex items-center justify-center bg-white transition-transform ${!showExplanation ? 'group-hover:scale-[1.02]' : ''
                    }`}
                  style={{ fontFamily: currentQuestion.rightFont }}
                >
                  <p className="text-3xl leading-relaxed text-center">
                    {foxQuote}
                  </p>
                </div>
              ) : currentQuestion.rightImage ? (
                <img
                  src={currentQuestion.rightImage}
                  alt="Design option B"
                  className={`w-full h-auto transition-transform ${!showExplanation ? 'group-hover:scale-[1.02]' : ''
                    }`}
                />
              ) : null}
              {!showExplanation && (
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-start justify-center pt-4">
                  <span className="text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Click to select
                  </span>
                </div>
              )}
              {selectedAnswer === 'right' && (
                <div className={`p-4 text-center font-medium ${isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                  {isCorrect ? '✓ Correct' : '✗ Your choice'}
                </div>
              )}
            </div>
          </div>

          {showExplanation && (
            <div className="mb-8 p-6 bg-green-50 border-l-4 border-green-500">
              <p className="text-gray-700 leading-relaxed">
                {currentQuestion.explanation}
              </p>
            </div>
          )}

          {showExplanation && (
            <div className="text-center">
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors"
              >
                {isLastQuestion ? 'Start Over' : 'Next Question'}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Level Complete Modal */}
      {showLevelCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-md mx-4 rounded-lg shadow-lg">
            <h2 className="text-2xl font-normal mb-4 text-center">
              {completedLevel === 'beginner' ? 'Easy Level Complete!' : 'Intermediate Level Complete!'}
            </h2>
            <p className="text-gray-700 mb-6 text-center leading-relaxed">
              {completedLevel === 'beginner' 
                ? 'Great job completing the beginner level! Ready to move on to the intermediate level?'
                : 'Congratulations! You\'ve completed all questions. Well done on finishing the entire quiz!'}
            </p>
            <div className="text-center">
              <button
                onClick={handleProceedToNextLevel}
                className="px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors"
              >
                {completedLevel === 'beginner' ? 'Continue to Next Level' : 'Start Over'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

