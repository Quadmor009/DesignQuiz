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
  const [showNameInputModal, setShowNameInputModal] = useState(false)
  
  // Coin state - track coins silently during session
  const [coins, setCoins] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set())
  const [isCoinAnimating, setIsCoinAnimating] = useState(false)
  
  // Time tracking
  const [startTime, setStartTime] = useState<number | null>(null)
  const [endTime, setEndTime] = useState<number | null>(null)
  
  // Player name
  const [playerName, setPlayerName] = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')
  const [submittingLeaderboard, setSubmittingLeaderboard] = useState(false)
  
  // Share tone toggle
  const [shareTone, setShareTone] = useState<'brag' | 'humble'>('brag')

  // Enable scrolling on quiz page
  useEffect(() => {
    document.body.classList.add('quiz-page')
    return () => {
      document.body.classList.remove('quiz-page')
    }
  }, [])

  // Scroll to top when question changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentQuestionIndex])

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
      
      // If this is the last question, automatically show the completion modal
      if (isLastQuestion) {
        setTimeout(() => {
          setCompletedLevel('expert')
          // Don't set endTime here - let the submission useEffect handle it
          setShowLevelCompleteModal(true)
        }, 500) // Small delay to show the explanation first
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
      // Don't set endTime here - let the submission useEffect handle it
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
      // Reset session completely if we completed the entire session
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
    setShowNameInputModal(true)
  }

  const handleNameSubmit = () => {
    if (playerName.trim()) {
      setShowNameInputModal(false)
      setStartTime(Date.now())
    }
  }

  // Auto-submit to leaderboard when session completes
  useEffect(() => {
    console.log('Submission check:', { 
      completedLevel, 
      startTime: !!startTime, 
      playerName: playerName.trim(), 
      endTime: !!endTime,
      coins,
      accuracy 
    })
    
    if (completedLevel === 'expert' && startTime && playerName.trim() && !endTime) {
      console.log('✅ Conditions met - submitting to leaderboard')
      const finalEndTime = Date.now()
      setEndTime(finalEndTime)
      
      // Submit to leaderboard
      const submitEntry = async () => {
        setSubmittingLeaderboard(true)
        try {
          const timeTaken = Math.floor((finalEndTime - startTime) / 1000)
          const level = 'all'
          
          const submissionData = {
            name: playerName.trim(),
            score: coins,
            accuracy: accuracy,
            timeTaken: timeTaken,
            level: level,
            twitterHandle: twitterHandle.trim() || null,
          }
          
          console.log('📤 Submitting to leaderboard:', submissionData)
          
          const response = await fetch('/api/leaderboard', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(submissionData),
          })
          
          if (response.ok) {
            const entry = await response.json()
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('lastLeaderboardEntryId', entry.id)
            }
            console.log('✅ Successfully submitted to leaderboard:', entry)
            // Don't show alert on success - it's annoying
          } else {
            // Get error message from response
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
            console.error('❌ Failed to submit to leaderboard:', response.status, errorData)
            // Only show alert for actual errors, not network timeouts
            if (response.status >= 500) {
              alert(`Server error saving score. Please check the leaderboard - it may have been saved.`)
            } else {
              alert(`Failed to save score: ${errorData.error || errorData.message || 'Unknown error'}`)
            }
          }
        } catch (error) {
          console.error('⚠️ Error submitting to leaderboard:', error)
          // "Failed to fetch" usually means network issue, but request might have succeeded
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          
          // Check for various network error patterns
          const isNetworkError = 
            errorMessage.includes('Failed to fetch') || 
            errorMessage.includes('NetworkError') ||
            errorMessage.includes('network') ||
            errorMessage.includes('timeout') ||
            errorMessage.includes('aborted')
          
          if (isNetworkError) {
            // Network error - request might have actually succeeded
            // Check if score appears on leaderboard instead of showing error
            console.log('⚠️ Network error detected, but request may have succeeded. Check leaderboard to confirm.')
            // Don't show alert - let user check leaderboard themselves
            // The score was likely saved successfully despite the network error
          } else {
            // Other errors - show alert
            alert(`Error saving score: ${errorMessage}`)
          }
        } finally {
          setSubmittingLeaderboard(false)
        }
      }
      
      submitEntry()
    }
  }, [completedLevel, startTime, playerName, coins, accuracy, endTime])

  const handleViewLeaderboard = () => {
    window.location.href = '/leaderboard'
  }

  const handleViewStats = () => {
    // Navigate to stats page with user identifier
    const identifier = twitterHandle.trim() 
      ? `?twitter=${twitterHandle.replace('@', '')}`
      : `?name=${encodeURIComponent(playerName.trim())}`
    window.location.href = `/stats${identifier}`
  }

  const handleShareOnTwitter = () => {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
    
    // Tweet templates for Brag mode - only the opening line changes
    const bragOpenings = [
      'Just crushed a session at Design Gym. My eye is getting sharper.',
      'Finished another round at Design Gym. Feeling confident about my design instincts.',
      'Design Gym session complete. My visual judgment is on point.',
      'Just leveled up my design eye at Design Gym. Results speak for themselves.'
    ]

    // Tweet templates for Humble mode - only the opening line changes
    const humbleOpenings = [
      'Just finished a session at Design Gym. Still learning, but making progress.',
      'Completed another round at Design Gym. Every session teaches me something new.',
      'Finished a Design Gym session. Practice makes progress, not perfect.',
      'Just wrapped up at Design Gym. Always room to improve, but happy with the effort.'
    ]

    // Select random opening based on tone
    const openings = shareTone === 'brag' ? bragOpenings : humbleOpenings
    const opening = openings[Math.floor(Math.random() * openings.length)]
    
    // Build tweet with consistent structure (score, accuracy, link never change)
    const tweetText = `${opening}

${coins} points • ${accuracy}% accuracy

${siteUrl}`
    
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

      <main className="min-h-screen bg-white px-3 sm:px-6 py-6 sm:py-12 md:px-12 md:py-16 w-full overflow-x-hidden">
        {/* Fixed coin counter at top-right */}
        <div className="fixed top-2 right-2 sm:top-8 sm:right-8 md:top-12 md:right-12 z-10">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 border-2 border-amber-200 rounded-[12px] px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-gradient-to-br from-amber-50 to-yellow-50">
            <svg 
              key={`coin-${coins}`}
              className={`w-4 h-4 sm:w-5 sm:h-5 ${isCoinAnimating ? 'coin-animate' : ''}`}
              style={{ transformOrigin: 'center', display: 'inline-block' }}
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
              <circle cx="12" cy="12" r="6" fill="#FCD34D" opacity="0.6"/>
              <path d="M12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8Z" fill="#F59E0B" opacity="0.3"/>
            </svg>
            <span className="text-xs sm:text-sm font-semibold text-amber-900">{coins}</span>
          </div>
        </div>
        <div className="max-w-6xl mx-auto w-full px-0">
          <div className="mb-8 sm:mb-12 text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-medium text-black mb-3 sm:mb-4 tracking-normal" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', letterSpacing: '0.02em' }}>
              Design Gym
            </div>
            <div className="mb-4">
              <div className="text-xs sm:text-sm text-gray-500 mb-2">
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

          <div className="mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl font-normal text-center mb-6 sm:mb-8 px-2 text-gray-900">
              {currentQuestion.type === 'image' 
                ? currentQuestion.prompt 
                : currentQuestion.prompt}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 mb-8 sm:mb-12 w-full">
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
                  className={`p-6 sm:p-8 min-h-[250px] sm:min-h-[300px] flex items-center justify-center bg-white transition-transform ${!showExplanation ? 'group-hover:scale-[1.02]' : ''
                    }`}
                  style={{ fontFamily: shuffledOptions.leftOption }}
                >
                  <p className="text-2xl sm:text-3xl leading-relaxed text-center px-2">
                    {foxQuote}
                  </p>
                </div>
              ) : (
                <img
                  src={shuffledOptions.leftOption}
                  alt="Design option"
                  className={`w-full h-auto object-contain transition-transform ${!showExplanation ? 'group-hover:scale-[1.02]' : ''
                    }`}
                  style={{ maxHeight: '400px' }}
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
                  className={`p-6 sm:p-8 min-h-[250px] sm:min-h-[300px] flex items-center justify-center bg-white transition-transform ${!showExplanation ? 'group-hover:scale-[1.02]' : ''
                    }`}
                  style={{ fontFamily: shuffledOptions.rightOption }}
                >
                  <p className="text-2xl sm:text-3xl leading-relaxed text-center px-2">
                    {foxQuote}
                  </p>
                </div>
              ) : (
                <img
                  src={shuffledOptions.rightOption}
                  alt="Design option"
                  className={`w-full h-auto object-contain transition-transform ${!showExplanation ? 'group-hover:scale-[1.02]' : ''
                    }`}
                  style={{ maxHeight: '400px', maxWidth: '100%' }}
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

          {showExplanation && !isLastQuestion && (
            <div className="text-center">
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors rounded-[8px]"
              >
                Next Question
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Instruction Modal - appears over first question */}
      {showInstructionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 max-w-lg w-full mx-4 rounded-[2rem] shadow-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-normal mb-8 text-center text-gray-900">
              How Design Gym Works
            </h2>
            
            <div className="flex flex-col md:flex-row gap-6 sm:gap-8 md:gap-12 mb-6 sm:mb-8 justify-center items-center md:items-start">
              <div className="flex flex-col items-center text-center w-full md:flex-1">
                <div className="mb-3">
                  <svg className="w-12 h-12 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Choose</h3>
                <p className="text-gray-700 leading-[20px] text-sm whitespace-pre-line">
                  Pick the better<br />design.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center w-full md:flex-1">
                <div className="mb-3">
                  <svg className="w-12 h-12 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Compare</h3>
                <p className="text-gray-700 leading-[20px] text-sm whitespace-pre-line">
                  Review both<br />after answering.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center w-full md:flex-1">
                <div className="mb-3">
                  <svg className="w-12 h-12 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Earn</h3>
                <p className="text-gray-700 leading-[20px] text-sm whitespace-pre-line">
                  Correct answers<br />earn 100 coins.
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={handleStartTraining}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors rounded-[8px] text-sm sm:text-base"
              >
                Start training
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Complete Modal */}
      {showLevelCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 max-w-md w-full mx-4 rounded-[2rem] shadow-lg max-h-[90vh] overflow-y-auto">
            {completedLevel === 'beginner' ? (
              <>
                <div className="flex justify-center mb-4">
                  <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-normal mb-4 text-center">
                  Beginner Level Complete!
                </h2>
                <p className="text-gray-700 mb-6 text-center leading-relaxed text-sm sm:text-base">
                  Great job completing the beginner level! Ready to move on to the intermediate level?
                </p>
                <div className="text-center">
                  <button
                    onClick={handleProceedToNextLevel}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors rounded-[8px] text-sm sm:text-base"
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
                <h2 className="text-xl sm:text-2xl font-normal mb-4 text-center">
                  Intermediate Level Complete!
                </h2>
                <p className="text-gray-700 mb-6 text-center leading-relaxed text-sm sm:text-base">
                  Excellent work! Ready to move on to the expert level?
                </p>
                <div className="text-center">
                  <button
                    onClick={handleProceedToNextLevel}
                    className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors rounded-[8px] text-sm sm:text-base"
                  >
                    Continue to Next Level
                  </button>
                </div>
              </>
            ) : completedLevel === 'expert' ? (
              <>
                <div className="flex justify-center mb-6">
                  <img 
                    src="/Icons/Brain%20icon%20copy.png" 
                    alt="Brain icon" 
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <h2 className="text-xl sm:text-2xl font-normal mb-4 sm:mb-6 text-center">
                  Session Complete
                </h2>
                <div className="mb-6">
                  <div className="mb-4 flex items-center justify-center gap-3 border-2 border-amber-200 rounded-[12px] px-6 py-4 bg-gradient-to-br from-amber-50 to-yellow-50 w-fit mx-auto">
                    <svg 
                      className="w-7 h-7 coin-animate-loop coin-glow"
                      viewBox="0 0 24 24" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="12" cy="12" r="10" fill="#F59E0B" stroke="#D97706" strokeWidth="1.5"/>
                      <circle cx="12" cy="12" r="6" fill="#FCD34D" opacity="0.6"/>
                      <path d="M12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8Z" fill="#F59E0B" opacity="0.3"/>
                    </svg>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-amber-700 uppercase tracking-wide">Coins Earned</span>
                      <span className="text-2xl font-bold text-amber-900">{coins}</span>
                    </div>
                  </div>
                  <div className={`text-2xl font-medium mb-2 text-center ${getAccuracyColor(accuracy)}`}>
                    Accuracy: {accuracy}%
                  </div>
                  <div className="text-base text-gray-700 text-center">
                    {getFeedback(accuracy)}
                  </div>
                </div>
                
                {/* Share Tone Toggle */}
                <div className="mb-4">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <span className="text-xs text-gray-500 font-medium">Share tone:</span>
                    <button
                      onClick={() => setShareTone('humble')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-[8px] transition-colors ${
                        shareTone === 'humble'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      Humble
                    </button>
                    <button
                      onClick={() => setShareTone('brag')}
                      className={`px-3 py-1.5 text-xs font-medium rounded-[8px] transition-colors ${
                        shareTone === 'brag'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      Brag
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <button
                    onClick={handleViewStats}
                    className="w-full sm:w-1/2 px-6 sm:px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors whitespace-nowrap rounded-[8px] text-sm sm:text-base"
                  >
                    View Your Stats
                  </button>
                  <button
                    onClick={handleViewLeaderboard}
                    className="w-full sm:w-1/2 px-6 sm:px-8 py-3 bg-gray-100 text-gray-900 font-normal hover:bg-gray-200 transition-colors whitespace-nowrap rounded-[8px] text-sm sm:text-base"
                  >
                    View Leaderboard
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <button
                    onClick={handleShareOnTwitter}
                    className="w-full px-6 sm:px-8 py-3 bg-blue-500 text-white font-normal hover:bg-blue-600 transition-colors whitespace-nowrap flex items-center justify-center gap-2 rounded-[8px] text-sm sm:text-base"
                  >
                    <svg className="w-5 h-5 sm:w-7 sm:h-7 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Share on X
                  </button>
                </div>
                <div className="text-center pt-4 border-t border-gray-200">
                  <button
                    onClick={handleStartOver}
                    className="text-base font-medium text-gray-900 hover:text-black transition-colors underline decoration-2 underline-offset-4 hover:decoration-gray-400"
                  >
                    Start Over
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Name Input Modal - appears before session starts */}
      {showNameInputModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 sm:p-8 max-w-md w-full mx-4 rounded-[2rem] shadow-lg">
            <h2 className="text-xl sm:text-2xl font-normal mb-4 text-center text-gray-900">
              Connect Your Account
            </h2>
            <p className="text-gray-600 mb-6 text-center text-xs sm:text-sm">
              Your name will appear on the leaderboard
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name *
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your name"
                maxLength={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-[8px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm sm:text-base"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && playerName.trim()) {
                    handleNameSubmit()
                  }
                }}
                autoFocus
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Twitter Handle (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm sm:text-base pointer-events-none">@</span>
                <input
                  type="text"
                  value={twitterHandle}
                  onChange={(e) => {
                    // Remove @ if user types it (we show it as a prefix)
                    const value = e.target.value.replace('@', '')
                    setTwitterHandle(value)
                  }}
                  placeholder="yourhandle"
                  maxLength={15}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-[8px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm sm:text-base"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && playerName.trim()) {
                      handleNameSubmit()
                    }
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Connect your Twitter to appear in social proof
              </p>
            </div>
            <div className="text-center">
              <button
                onClick={handleNameSubmit}
                disabled={!playerName.trim()}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors rounded-[8px] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                Start Training
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
