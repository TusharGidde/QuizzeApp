
function isCorrectAnswer(userAnswer) {
  if (this.questionType === 'single') {
    return userAnswer === this.correctAnswer;
  } else {
    // For multiple choice, compare arrays
    let correctAnswers = [];
    if (typeof this.correctAnswer === 'string') {
      correctAnswers = this.correctAnswer.split(',').map(a => a.trim()).sort();
    } else if (Array.isArray(this.correctAnswer)) {
      correctAnswers = this.correctAnswer.map(a => a.toString().trim()).sort();
    } else {
      correctAnswers = [];
    }

    const userAnswers = Array.isArray(userAnswer) 
      ? userAnswer.map(a => a.toString().trim()).sort()
      : (typeof userAnswer === 'string' ? userAnswer.split(',').map(a => a.trim()).sort() : []);

    return JSON.stringify(correctAnswers) === JSON.stringify(userAnswers);
  }
}

function calculateScore(userAnswer) {
  if (this.questionType === 'single') {
    return this.isCorrectAnswer(userAnswer) ? this.points : 0;
  } else {
    // Partial scoring for multiple choice
    let correctAnswers = [];
    if (typeof this.correctAnswer === 'string') {
      correctAnswers = this.correctAnswer.split(',').map(a => a.trim());
    } else if (Array.isArray(this.correctAnswer)) {
      correctAnswers = this.correctAnswer.map(a => a.toString().trim());
    } else {
      correctAnswers = [];
    }

    const userAnswers = Array.isArray(userAnswer) 
      ? userAnswer.map(a => a.toString().trim())
      : (typeof userAnswer === 'string' ? userAnswer.split(',').map(a => a.trim()) : []);

    const correctCount = userAnswers.filter(answer => 
      correctAnswers.includes(answer)
    ).length;

    const incorrectCount = userAnswers.filter(answer => 
      !correctAnswers.includes(answer)
    ).length;

    // Partial scoring: (correct - incorrect) / total correct * points
    const score = Math.max(0, (correctCount - incorrectCount) / (correctAnswers.length || 1) * this.points);
    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }
}

function toJSON() {
  const values = { ...this.get() };
  delete values.deletedAt;
  return values;
}

module.exports = {
  toJSON,
  isCorrectAnswer,
  calculateScore
};
