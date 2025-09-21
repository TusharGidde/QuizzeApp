const DataService = require('../services/dataService');
const { Question, Quiz } = require('../models');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

class AdminController {
  /**
   * Import questions from CSV file
   */
  static async importQuestions(req, res) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const quizId  = req.params.id;
      // const quizId = req.params.id;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No CSV file uploaded'
        });
      }

      // Validate CSV format first
      const formatValidation = await DataService.validateCSVFormat(req.file.path);
      if (!formatValidation.valid) {
        // Clean up uploaded file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(400).json({
          success: false,
          message: 'Invalid CSV format',
          error: formatValidation.error
        });
      }

      // Import questions
      const result = await DataService.importQuestionsFromCSV(req.file.path, quizId);

      res.status(200).json({
        success: true,
        message: `Successfully imported ${result.imported} questions`,
        data: {
          imported: result.imported,
          errors: result.errors,
          results: result.results,
          errorDetails: result.errors > 0 ? result.errors : undefined
        }
      });

    } catch (error) {
      console.error('Import questions error:', error);
      
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: 'Failed to import questions',
        error: error.message
      });
    }
  }

  /**
   * Soft delete question
   */
  static async deleteQuestion(req, res) {
    try {
      const { id } = req.params;
      
      const question = await Question.findByPk(id);
      if (!question) {
        return res.status(404).json({
          success: false,
          message: 'Question not found'
        });
      }

      await question.destroy(); // Soft delete due to paranoid: true
      
      res.status(200).json({
        success: true,
        message: 'Question deleted successfully',
        data: {
          questionId: id,
          deletedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Delete question error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete question',
        error: error.message
      });
    }
  }

  /**
   * Set quiz expiry date
   */
  static async setQuizExpiry(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { expiresAt } = req.body;
      
      const quiz = await Quiz.findByPk(id);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          message: 'Quiz not found'
        });
      }

      // Validate expiry date is in the future
      const expiryDate = new Date(expiresAt);
      if (expiryDate <= new Date()) {
        return res.status(400).json({
          success: false,
          message: 'Expiry date must be in the future'
        });
      }

      await quiz.update({ expiresAt: expiryDate });
      
      res.status(200).json({
        success: true,
        message: 'Quiz expiry date updated successfully',
        data: {
          quizId: id,
          expiresAt: expiryDate,
          quiz: quiz.toJSON()
        }
      });

    } catch (error) {
      console.error('Set quiz expiry error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update quiz expiry',
        error: error.message
      });
    }
  }

}

module.exports = AdminController;