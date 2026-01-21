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
  
  // Process each level
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
  
  // Shuffle all selected questions together for a mixed order
  const finalQuestions = shuffleArray(selectedQuestions)
  
  // Debug: verify we have the correct number of questions
  console.log(`Selected ${finalQuestions.length} questions (should be 12)`)
  
  return finalQuestions
}

export default function Home() {
  // Initialize randomized questions only once using function initializer
  // This prevents reshuffling on re-render
  // Each session will have: 5 beginner + 7 mid = 12 total questions
  const [sessionQuestions] = useState<Question[]>(() => getRandomizedQuestions())
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<'left' | 'right' | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)

  const currentQuestion = sessionQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === sessionQuestions.length - 1

  const handleSelect = (side: 'left' | 'right') => {
    if (!showExplanation) {
      setSelectedAnswer(side)
      setShowExplanation(true)
    }
  }

  const handleNext = () => {
    if (isLastQuestion) {
      // Reset to first question
      setCurrentQuestionIndex(0)
    } else {
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
        <link href="https://fonts.googleapis.com/css2?family=Poppins&display=swap" rel="stylesheet" />
      </Head>
      <main className="min-h-screen bg-white px-6 py-12 md:px-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-light tracking-tight mb-4">
              Design Quiz
            </h1>
            <div className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {sessionQuestions.length}
              {/* Debug: Remove this after confirming it works */}
              <span className="ml-2 text-xs text-gray-400">
                (Total in session: {sessionQuestions.length} questions)
              </span>
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
    </>
  )
}

