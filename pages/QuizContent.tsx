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

export default function QuizContent() {
  // Initialize randomized questions only once using function initializer
  // This prevents reshuffling on re-render
  // Each session will have: 5 beginner + 7 mid = 12 total questions
  const [sessionQuestions] = useState<Question[]>(() => getRandomizedQuestions())
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<'left' | 'right' | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState(false)
  const [completedLevel, setCompletedLevel] = useState<'beginner' | 'mid' | null>(null)
  
  // Scoring state - track points silently during quiz
  const [score, setScore] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set())

  const currentQuestion = sessionQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === sessionQuestions.length - 1
  
  // Questions are ordered: first 5 are beginner (indices 0-4), next 7 are mid (indices 5-11)
  const BEGINNER_QUESTIONS_COUNT = QUESTIONS_PER_LEVEL.beginner
  const isLastBeginnerQuestion = currentQuestionIndex === BEGINNER_QUESTIONS_COUNT - 1
  const isLastMidQuestion = currentQuestionIndex === sessionQuestions.length - 1

  const handleSelect = (side: 'left' | 'right') => {
    if (!showExplanation && currentQuestion) {
      setSelectedAnswer(side)
      setShowExplanation(true)
      
      // Track score silently - add 100 points for correct answer (only once per question)
      const isCorrect = side === currentQuestion.correctAnswer
      if (isCorrect && !answeredQuestions.has(currentQuestionIndex)) {
        setScore(prevScore => prevScore + 100)
        setAnsweredQuestions(prev => new Set(prev).add(currentQuestionIndex))
      } else if (!isCorrect && !answeredQuestions.has(currentQuestionIndex)) {
        // Mark question as answered even if incorrect (to prevent double counting)
        setAnsweredQuestions(prev => new Set(prev).add(currentQuestionIndex))
      }
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

  // Calculate total possible points and accuracy
  const totalQuestions = sessionQuestions.length
  const totalPossiblePoints = totalQuestions * 100
  const accuracy = totalQuestions > 0 ? Math.round((score / totalPossiblePoints) * 100) : 0

  const handleProceedToNextLevel = () => {
    setShowLevelCompleteModal(false)
    setCompletedLevel(null)
    
    if (isLastQuestion) {
      // Reset quiz completely if we completed the entire quiz
      setCurrentQuestionIndex(0)
      setScore(0)
      setAnsweredQuestions(new Set())
    } else {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
    setSelectedAnswer(null)
    setShowExplanation(false)
  }

  const handleShareOnTwitter = () => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const tweetText = `Just trained my design instincts at Design Gym
Score: ${score} / ${totalPossiblePoints}
Accuracy: ${accuracy}% 

Train your eye → ${siteUrl}`
    
    const encodedText = encodeURIComponent(tweetText)
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`
    
    window.open(twitterUrl, '_blank')
  }
  
  // Qualitative feedback based on accuracy
  const getFeedback = (accuracy: number): string => {
    if (accuracy >= 80) return 'Strong'
    if (accuracy >= 50) return 'Solid'
    return 'Needs practice'
  }

  // Only calculate isCorrect if we have both a selected answer and a current question
  const isCorrect = currentQuestion && selectedAnswer !== null ? selectedAnswer === currentQuestion.correctAnswer : false

  // Safety check: if no current question, show loading or error state
  if (!currentQuestion) {
    return (
      <>
        <Head>
          <title>Design Gym - Training</title>
        </Head>
        <main className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Loading questions...</p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Design Gym - Training</title>
        <meta name="description" content="Practice your visual judgment" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="min-h-screen bg-white px-6 py-12 md:px-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <div className="text-xl md:text-2xl font-medium text-black mb-4 tracking-normal" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '0.02em' }}>
              Design Gym
            </div>
            <div className="text-lg font-medium text-black mb-6">
              Score: {score} / {totalPossiblePoints}
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
                  {isCorrect ? '✓ Correct +100 points' : '✗ Your choice'}
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
                  {isCorrect ? '✓ Correct +100 points' : '✗ Your choice'}
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
            {completedLevel === 'beginner' ? (
              <>
                <h2 className="text-2xl font-normal mb-4 text-center">
                  Easy Level Complete!
                </h2>
                <p className="text-gray-700 mb-6 text-center leading-relaxed">
                  Great job completing the beginner level! Ready to move on to the intermediate level?
                </p>
                <div className="text-center">
                  <button
                    onClick={handleProceedToNextLevel}
                    className="px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors"
                  >
                    Continue to Next Level
                  </button>
                </div>
              </>
            ) : completedLevel === 'mid' ? (
              <>
                <h2 className="text-2xl font-normal mb-6 text-center">
                  Quiz Complete
                </h2>
                <div className="mb-6 text-center">
                  <div className="text-4xl font-normal mb-2 text-gray-900">
                    {score} / {totalPossiblePoints}
                  </div>
                  <div className="text-lg text-gray-600 mb-4">
                    {accuracy}% accuracy
                  </div>
                  <div className="text-base text-gray-700">
                    {getFeedback(accuracy)}
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <button
                    onClick={handleShareOnTwitter}
                    className="block w-full px-8 py-3 bg-blue-500 text-white font-normal hover:bg-blue-600 transition-colors"
                  >
                    Share on Twitter
                  </button>
                  <button
                    onClick={() => {
                      handleShareOnTwitter()
                      handleProceedToNextLevel()
                    }}
                    className="block w-full px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors"
                  >
                    Share Scores
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}

