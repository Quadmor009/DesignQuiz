import { useState, useEffect, useMemo } from 'react'
import Head from 'next/head'
import { questions, foxQuote, Question } from '../data/quizData'

// Configuration for questions per level - never show all questions
const QUESTIONS_PER_LEVEL: Record<'beginner' | 'mid' | 'expert', number> = {
  beginner: 5, // Show 5 out of 20 beginner questions
  mid: 7, // Show 7 out of 20 mid questions
  expert: 8, // Show 8 out of 20 expert questions
}

// Required pool composition - validate that pools meet these requirements
const REQUIRED_POOL_COMPOSITION: Record<'beginner' | 'mid' | 'expert', { image: number; typeface: number }> = {
  beginner: { image: 15, typeface: 5 },
  mid: { image: 12, typeface: 8 },
  expert: { image: 13, typeface: 7 }
}

// Helper function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Validate that all questions have explicit difficulty fields
function validateQuestions(questions: Question[]): void {
  const missingDifficulty = questions.filter(q => !q.difficulty)
  if (missingDifficulty.length > 0) {
    throw new Error(
      `CRITICAL: ${missingDifficulty.length} question(s) are missing explicit difficulty field. ` +
      `Questions must explicitly define difficulty: "beginner" | "mid" | "expert". ` +
      `Missing difficulty in questions: ${missingDifficulty.map(q => q.id).join(', ')}`
    )
  }
}

// Validate that difficulty pools meet required composition
function validatePoolComposition(
  difficulty: 'beginner' | 'mid' | 'expert',
  imageQuestions: Question[],
  typefaceQuestions: Question[]
): void {
  const required = REQUIRED_POOL_COMPOSITION[difficulty]
  const actualImage = imageQuestions.length
  const actualTypeface = typefaceQuestions.length
  
  if (actualImage !== required.image || actualTypeface !== required.typeface) {
    throw new Error(
      `CRITICAL: ${difficulty} difficulty pool does not meet required composition. ` +
      `Required: ${required.image} image, ${required.typeface} typeface. ` +
      `Actual: ${actualImage} image, ${actualTypeface} typeface. ` +
      `Difficulty must be explicitly defined in question data - do not infer from filenames, IDs, or indexes.`
    )
  }
}

// Select and randomize questions from all levels
// STRICT RULES: Filter by explicit difficulty field only - never infer from filenames, IDs, or indexes
function getRandomizedQuestions(): Question[] {
  // First, validate all questions have explicit difficulty
  validateQuestions(questions)
  
  const selectedQuestions: Question[] = []
  
  // Process each level in order: beginner, mid, expert
  for (const level of ['beginner', 'mid', 'expert'] as const) {
    // STEP 1: Filter questions by explicit difficulty field ONLY
    // This is the ONLY source of truth - do NOT infer from filenames, IDs, or indexes
    const levelQuestions = questions.filter(q => {
      if (!q.difficulty) {
        throw new Error(
          `CRITICAL: Question ${q.id} is missing explicit difficulty field. ` +
          `Every question must explicitly define difficulty: "beginner" | "mid" | "expert"`
        )
      }
      return q.difficulty === level
    })
    
    // STEP 2: Split by type within this difficulty pool
    const imageQuestions = levelQuestions.filter(q => q.type === 'image')
    const typefaceQuestions = levelQuestions.filter(q => q.type === 'typeface')
    
    // STEP 3: Validate pool composition matches requirements
    validatePoolComposition(level, imageQuestions, typefaceQuestions)
    
    // STEP 4: Shuffle within each type pool
    const shuffledImage = shuffleArray(imageQuestions)
    const shuffledTypeface = shuffleArray(typefaceQuestions)
    
    // STEP 5: Select required number from this difficulty level
    // (Selection is random - doesn't need to maintain image/typeface ratio)
    const allShuffled = shuffleArray([...shuffledImage, ...shuffledTypeface])
    const count = QUESTIONS_PER_LEVEL[level]
    
    if (allShuffled.length < count) {
      throw new Error(
        `CRITICAL: ${level} difficulty pool has only ${allShuffled.length} questions, ` +
        `but ${count} are required for selection.`
      )
    }
    
    const selected = allShuffled.slice(0, count)
    selectedQuestions.push(...selected)
  }
  
  // STEP 6: Return questions in level order (beginner, mid, expert)
  // Each level is shuffled within itself, but levels remain in order
  return selectedQuestions
}

// Shuffle answer options at render time
// Returns shuffled options with the correct answer position tracked
// Since optionA is always correct (from "-a" variant), we track where it ends up
function shuffleOptions(optionA: string, optionB: string, correctOption: "A") {
  const options = [
    { value: optionA, isCorrect: true },
    { value: optionB, isCorrect: false }
  ]
  const shuffled = shuffleArray(options)
  
  // Determine which position (left or right) has the correct answer
  const leftIsCorrect = shuffled[0].isCorrect
  const correctAnswer = leftIsCorrect ? 'left' : 'right'
  
  return {
    leftOption: shuffled[0].value,
    rightOption: shuffled[1].value,
    correctAnswer: correctAnswer
  }
}

export default function QuizContent() {
  // Initialize randomized questions only once using function initializer
  // This prevents reshuffling on re-render
  const [sessionQuestions] = useState<Question[]>(() => getRandomizedQuestions())
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<'left' | 'right' | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState(false)
  const [completedLevel, setCompletedLevel] = useState<'beginner' | 'mid' | 'expert' | null>(null)
  const [showInstructionModal, setShowInstructionModal] = useState(true)
  
  // Coin state - track coins silently during quiz
  const [coins, setCoins] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set())
  const [isCoinAnimating, setIsCoinAnimating] = useState(false)

  const currentQuestion = sessionQuestions[currentQuestionIndex]
  
  // Shuffle options at render time for each question
  // This ensures options are randomly positioned each time
  const shuffledOptions = useMemo(() => {
    if (!currentQuestion) return null
    return shuffleOptions(
      currentQuestion.optionA,
      currentQuestion.optionB,
      currentQuestion.correctOption
    )
  }, [currentQuestion])

  // Check if we're at the last question
  const isLastQuestion = currentQuestionIndex === sessionQuestions.length - 1

  const handleSelect = (side: 'left' | 'right') => {
    if (!showExplanation && currentQuestion && shuffledOptions) {
      setSelectedAnswer(side)
      setShowExplanation(true)
      
      // Determine if the selected answer is correct
      // The correct answer position is tracked in shuffledOptions.correctAnswer
      const isCorrect = side === shuffledOptions.correctAnswer
      
      // Track coins silently - add 100 coins for correct answer (only once per question)
      if (isCorrect && !answeredQuestions.has(currentQuestionIndex)) {
        setAnsweredQuestions(prev => new Set(prev).add(currentQuestionIndex))
        setCoins(prevCoins => prevCoins + 100)
        // Trigger coin bounce animation
        setIsCoinAnimating(true)
        // Remove animation class after animation completes (400ms)
        setTimeout(() => {
          setIsCoinAnimating(false)
        }, 400)
      } else if (!isCorrect && !answeredQuestions.has(currentQuestionIndex)) {
        // Mark question as answered even if incorrect (to prevent double counting)
        setAnsweredQuestions(prev => new Set(prev).add(currentQuestionIndex))
      }
    }
  }

  const handleNext = () => {
    // Check if we just completed question 5 (beginner level complete)
    // After answering question 5 (index 4), clicking Next should show modal
    if (currentQuestionIndex === 4) {
      setCompletedLevel('beginner')
      setShowLevelCompleteModal(true)
      return
    }
    
    // Check if we just completed question 12 (mid level complete)
    // After answering question 12 (index 11), clicking Next should show modal
    if (currentQuestionIndex === 11) {
      setCompletedLevel('mid')
      setShowLevelCompleteModal(true)
      return
    }
    
    // Check if we just completed the last question (expert level complete)
    if (isLastQuestion) {
      setCompletedLevel('expert')
      setShowLevelCompleteModal(true)
      return
    }
    
    // Move to next question
    setCurrentQuestionIndex(currentQuestionIndex + 1)
    setSelectedAnswer(null)
    setShowExplanation(false)
  }

  // Calculate max coins and accuracy
  const totalQuestions = sessionQuestions.length
  const maxCoins = totalQuestions * 100
  const accuracy = totalQuestions > 0 ? Math.round((coins / maxCoins) * 100) : 0

  const handleProceedToNextLevel = () => {
    setShowLevelCompleteModal(false)
    setCompletedLevel(null)
    
    if (isLastQuestion) {
      // Reset quiz completely if we completed the entire quiz
      setCurrentQuestionIndex(0)
      setCoins(0)
      setAnsweredQuestions(new Set())
    } else {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
    setSelectedAnswer(null)
    setShowExplanation(false)
  }

  const handleStartOver = () => {
    setShowLevelCompleteModal(false)
    setCompletedLevel(null)
    setCurrentQuestionIndex(0)
    setCoins(0)
    setAnsweredQuestions(new Set())
    setSelectedAnswer(null)
    setShowExplanation(false)
  }

  const handleStartTraining = () => {
    setShowInstructionModal(false)
  }

  const handleShareOnTwitter = () => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const tweetText = `Just trained my design instincts at Design Gym
Coins: ${coins} / ${maxCoins}
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

  // Get color for accuracy display
  // Orange for Solid (50-79), Green for Strong (>=80), Red for Needs practice (<50)
  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 80) return 'text-green-600' // Strong - Green
    if (accuracy >= 50) return 'text-orange-600' // Solid - Orange
    return 'text-red-600' // Needs practice - Red
  }

  // Determine if the selected answer is correct
  const isCorrect = currentQuestion && selectedAnswer !== null && shuffledOptions
    ? selectedAnswer === shuffledOptions.correctAnswer
    : false

  // Safety check: if no current question, show loading or error state
  if (!currentQuestion || !shuffledOptions) {
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

  // Determine which option is correct for visual feedback
  const leftIsCorrect = shuffledOptions.correctAnswer === 'left'
  const rightIsCorrect = shuffledOptions.correctAnswer === 'right'

  return (
    <>
      <Head>
        <title>Design Gym - Training</title>
        <meta name="description" content="Practice your visual judgment" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-white px-6 py-12 md:px-12 md:py-16">
        {/* Fixed coin counter at top-right */}
        <div className="fixed top-12 right-12 z-10">
          <div className="text-sm font-medium text-gray-700 border border-gray-300 bg-white px-4 py-2.5 rounded-[12px] flex items-center gap-2 shadow-sm">
            <svg 
              key={`coin-${coins}`}
              className={`w-5 h-5 ${isCoinAnimating ? 'coin-animate' : ''}`}
              style={{ transformOrigin: 'center', display: 'inline-block' }}
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="6" fill="#FCD34D" opacity="0.6"/>
              <path d="M12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8Z" fill="#F59E0B" opacity="0.3"/>
            </svg>
            <span className="font-semibold">{coins}</span>
          </div>
        </div>
        <div className="max-w-6xl mx-auto">
          <div className="mb-12 text-center">
            <div className="text-xl md:text-2xl font-medium text-black mb-4 tracking-normal" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '0.02em' }}>
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
              {currentQuestion.type === 'image' 
                ? currentQuestion.prompt 
                : currentQuestion.prompt}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div
              onClick={() => handleSelect('left')}
              className={`cursor-pointer transition-all relative group ${currentQuestion.type === 'typeface'
                  ? ''
                  : `border-2 ${selectedAnswer === 'left'
                    ? isCorrect
                      ? 'border-green-500'
                      : 'border-red-500'
                    : showExplanation && leftIsCorrect
                      ? 'border-green-500'
                      : 'border-gray-200 hover:border-gray-400'
                  }`
                }`}
            >
              {currentQuestion.type === 'typeface' ? (
                <div
                  className={`p-8 min-h-[300px] flex items-center justify-center bg-white transition-transform ${!showExplanation ? 'group-hover:scale-[1.02]' : ''
                    }`}
                  style={{ fontFamily: shuffledOptions.leftOption }}
                >
                  <p className="text-3xl leading-relaxed text-center">
                    {foxQuote}
                  </p>
                </div>
              ) : (
                <img
                  src={shuffledOptions.leftOption}
                  alt="Design option"
                  className={`w-full h-auto transition-transform ${!showExplanation ? 'group-hover:scale-[1.02]' : ''
                    }`}
                />
              )}
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
                  {isCorrect ? '✓ Correct +100 coins' : '✗ Your choice'}
                </div>
              )}
            </div>

            <div
              onClick={() => handleSelect('right')}
              className={`cursor-pointer transition-all relative group ${currentQuestion.type === 'typeface'
                  ? ''
                  : `border-2 ${selectedAnswer === 'right'
                    ? isCorrect
                      ? 'border-green-500'
                      : 'border-red-500'
                    : showExplanation && rightIsCorrect
                      ? 'border-green-500'
                      : 'border-gray-200 hover:border-gray-400'
                  }`
                }`}
            >
              {currentQuestion.type === 'typeface' ? (
                <div
                  className={`p-8 min-h-[300px] flex items-center justify-center bg-white transition-transform ${!showExplanation ? 'group-hover:scale-[1.02]' : ''
                    }`}
                  style={{ fontFamily: shuffledOptions.rightOption }}
                >
                  <p className="text-3xl leading-relaxed text-center">
                    {foxQuote}
                  </p>
                </div>
              ) : (
                <img
                  src={shuffledOptions.rightOption}
                  alt="Design option"
                  className={`w-full h-auto transition-transform ${!showExplanation ? 'group-hover:scale-[1.02]' : ''
                    }`}
                />
              )}
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
                  {isCorrect ? '✓ Correct +100 coins' : '✗ Your choice'}
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
                className="px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors rounded-[12px]"
              >
                {isLastQuestion ? 'Start Over' : 'Next Question'}
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Instruction Modal - appears over first question */}
      {showInstructionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-lg mx-4 rounded-[2rem] shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-normal mb-8 text-center text-gray-900">
              How Design Gym Works
            </h2>
            
            <div className="flex flex-col md:flex-row gap-8 md:gap-6 mb-8 justify-center items-start">
              <div className="flex flex-col items-center text-center flex-1">
                <div className="mb-3">
                  <svg className="w-12 h-12 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Choose</h3>
                <p className="text-gray-700 leading-[20px] text-sm">
                  Pick the better<br />design.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center flex-1">
                <div className="mb-3">
                  <svg className="w-12 h-12 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Compare</h3>
                <p className="text-gray-700 leading-[20px] text-sm">
                  Review both designs<br />after answering.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center flex-1">
                <div className="mb-3">
                  <svg className="w-12 h-12 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Earn</h3>
                <p className="text-gray-700 leading-[20px] text-sm">
                  Each correct answer earns 100 coins.
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={handleStartTraining}
                className="px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors rounded-[12px]"
              >
                Start training
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Complete Modal */}
      {showLevelCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 max-w-md mx-4 rounded-[2rem] shadow-lg">
            {completedLevel === 'beginner' ? (
              <>
                <div className="flex justify-center mb-4">
                  <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-normal mb-4 text-center">
                  Beginner Level Complete!
                </h2>
                <p className="text-gray-700 mb-6 text-center leading-relaxed">
                  Great job completing the beginner level! Ready to move on to the intermediate level?
                </p>
                <div className="text-center">
                  <button
                    onClick={handleProceedToNextLevel}
                    className="px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors rounded-[12px]"
                  >
                    Continue to Next Level
                  </button>
                </div>
              </>
            ) : completedLevel === 'mid' ? (
              <>
                <div className="flex justify-center mb-4">
                  <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-normal mb-4 text-center">
                  Intermediate Level Complete!
                </h2>
                <p className="text-gray-700 mb-6 text-center leading-relaxed">
                  Excellent work! Ready to move on to the expert level?
                </p>
                <div className="text-center">
                  <button
                    onClick={handleProceedToNextLevel}
                    className="px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors rounded-[12px]"
                  >
                    Continue to Next Level
                  </button>
                </div>
              </>
            ) : completedLevel === 'expert' ? (
              <>
                <div className="flex justify-center mb-6">
                  <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-normal mb-6 text-center">
                  Quiz Complete
                </h2>
                <div className="mb-6 text-center">
                  <div className="text-base text-gray-700 mb-4 flex items-center justify-center gap-2">
                    <svg 
                      className="w-5 h-5"
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="12" r="10" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
                      <circle cx="12" cy="12" r="6" fill="#FCD34D" opacity="0.6"/>
                      <path d="M12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8Z" fill="#F59E0B" opacity="0.3"/>
                    </svg>
                    <span>Coins: {coins}</span>
                  </div>
                  <div className={`text-2xl font-medium mb-2 ${getAccuracyColor(accuracy)}`}>
                    Accuracy: {accuracy}%
                  </div>
                  <div className="text-base text-gray-700">
                    {getFeedback(accuracy)}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleShareOnTwitter}
                    className="w-1/2 px-8 py-3 bg-blue-500 text-white font-normal hover:bg-blue-600 transition-colors whitespace-nowrap flex items-center justify-center gap-2 rounded-[12px]"
                  >
                    <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Share on X
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="w-1/2 px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors whitespace-nowrap rounded-[12px]"
                  >
                    Start Over
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
