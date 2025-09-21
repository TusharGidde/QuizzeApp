const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const fs = require('fs');
const path = require('path');
const { Question, Quiz, Attempt, User } = require('../models');
const { Op } = require('sequelize');

class DataService {
  /**
   * Import questions from CSV file
   * Expected CSV format: question,option1,option2,option3,option4,option5,option6,correctAnswer,questionType,points
   */
  static async importQuestionsFromCSV(filePath, quizId) {
    const results = [];
    const errors = [];
    let lineNumber = 1; // Start from 1 for header

    try {
      // Verify quiz exists
      const quiz = await Quiz.findByPk(quizId);
      if (!quiz) {
        throw new Error(`Quiz with ID ${quizId} not found`);
      }

      // Parse CSV file
      const csvData = await this.parseCSVFile(filePath);
      
      for (const row of csvData) {
        lineNumber++;
        try {
          const validatedQuestion = await this.validateQuestionRow(row, quizId, lineNumber);
          
          // Check for duplicates
          const existingQuestion = await Question.findOne({
            where: {
              quizId: quizId,
              question: validatedQuestion.question
            }
          });

          if (existingQuestion) {
            errors.push({
              line: lineNumber,
              error: 'Duplicate question found',
              data: row
            });
            continue;
          }

          // Create question
          const question = await Question.create(validatedQuestion);
          results.push({
            line: lineNumber,
            questionId: question.id,
            question: question.question
          });

        } catch (error) {
          errors.push({
            line: lineNumber,
            error: error.message,
            data: row
          });
        }
      }

      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return {
        success: true,
        imported: results.length,
        errors: errors.length,
        results,
        errors
      };

    } catch (error) {
      // Clean up uploaded file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  }


  /**
   * Parse CSV file and return data
   */
  static parseCSVFile(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  /**
   * Validate question row from CSV
   */
  static async validateQuestionRow(row, quizId, lineNumber) {
    const errors = [];

    // Required fields validation
    if (!row.question || row.question.trim().length === 0) {
      errors.push('Question text is required');
    }

    if (!row.correctAnswer || row.correctAnswer.trim().length === 0) {
      errors.push('Correct answer is required');
    }

    // Collect options (option1, option2, etc.)
    const options = [];
    for (let i = 1; i <= 6; i++) {
      const optionKey = `option${i}`;
      if (row[optionKey] && row[optionKey].trim().length > 0) {
        options.push(row[optionKey].trim());
      }
    }

    if (options.length < 2) {
      errors.push('At least 2 options are required');
    }

    if (options.length > 6) {
      errors.push('Maximum 6 options allowed');
    }

    // Question type validation
    const questionType = row.questionType || 'single';
    if (!['single', 'multiple'].includes(questionType)) {
      errors.push('Question type must be either "single" or "multiple"');
    }

    // Points validation
    let points = parseInt(row.points) || 1;
    if (points < 1 || points > 10) {
      errors.push('Points must be between 1 and 10');
    }

    // Correct answer validation
    const correctAnswer = row.correctAnswer.trim();
    if (questionType === 'single') {
      if (!options.includes(correctAnswer)) {
        errors.push('Correct answer must be one of the provided options');
      }
    } else {
      // For multiple choice, correct answer can be comma-separated
      const correctAnswers = correctAnswer.split(',').map(a => a.trim());
      for (const answer of correctAnswers) {
        if (!options.includes(answer)) {
          errors.push(`Correct answer "${answer}" must be one of the provided options`);
        }
      }
    }

    // Question length validation
    if (row.question && (row.question.length < 10 || row.question.length > 2000)) {
      errors.push('Question must be between 10 and 2000 characters');
    }

    if (errors.length > 0) {
      throw new Error(`Line ${lineNumber}: ${errors.join(', ')}`);
    }

    return {
      quizId,
      question: row.question.trim(),
      options,
      correctAnswer,
      questionType,
      points
    };
  }

  /**
   * Validate CSV format and structure
   */
  static async validateCSVFormat(filePath) {
    try {
      const data = await this.parseCSVFile(filePath);
      
      if (data.length === 0) {
        throw new Error('CSV file is empty');
      }

      // Check required headers
      const requiredHeaders = ['question', 'option1', 'option2', 'correctAnswer'];
      const firstRow = data[0];
      const headers = Object.keys(firstRow);
      
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
      }

      return {
        valid: true,
        rowCount: data.length,
        headers
      };

    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Get export file for download
   */
  static getExportFile(filename) {
    const filePath = path.join(__dirname, '../exports', filename);
    
    if (!fs.existsSync(filePath)) {
      throw new Error('Export file not found');
    }

    return {
      filePath,
      filename,
      size: fs.statSync(filePath).size
    };
  }

  /**
   * Clean up old export files (older than 24 hours)
   */
  static cleanupOldExports() {
    const exportsDir = path.join(__dirname, '../exports');
    
    if (!fs.existsSync(exportsDir)) {
      return;
    }

    const files = fs.readdirSync(exportsDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    files.forEach(file => {
      const filePath = path.join(exportsDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old export file: ${file}`);
      }
    });
  }
}

module.exports = DataService;