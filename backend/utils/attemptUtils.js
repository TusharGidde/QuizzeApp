const { QueryTypes } = require('sequelize');


function getPercentageScore() {
  if (this.maxScore === 0) return 0;
  return Math.round((this.score / this.maxScore) * 100 * 100) / 100;
}

function getFormattedTime() {
  const hours = Math.floor(this.timeTaken / 3600);
  const minutes = Math.floor((this.timeTaken % 3600) / 60);
  const seconds = this.timeTaken % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

function toJSON() {
  const values = { ...this.get() };
  return {
    ...values,
    percentageScore: this.getPercentageScore(),
    formattedTime: this.getFormattedTime()
  };
}

// Static methods as pure functions
async function getBestScoreForUser(model, userId, quizId) {
  return await model.findOne({
    where: { userId, quizId },
    order: [['score', 'DESC']],
    limit: 1
  });
}

async function getLeaderboard(model, quizId, limit = 10, sequelizeInstance) {
  const query = `
    SELECT 
      a.user_id,
      u.name as user_name,
      MAX(a.score) as best_score,
      a.max_score,
      MIN(a.completed_at) as first_completed_at
    FROM attempts a
    JOIN users u ON a.user_id = u.id
    WHERE a.quiz_id = :quizId AND u.deleted_at IS NULL
    GROUP BY a.user_id, u.name, a.max_score
    ORDER BY best_score DESC, first_completed_at ASC
    LIMIT :limit
  `;
  return await sequelizeInstance.query(query, {
    replacements: { quizId, limit },
    type: QueryTypes.SELECT
  });
}

module.exports = {
  getPercentageScore,
  getFormattedTime,
  toJSON,
  getBestScoreForUser,
  getLeaderboard
};
