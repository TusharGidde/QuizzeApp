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
   * Export quiz attempts to CSV
   */
  static async exportAttempts(req, res) {
    try {
      const filters = {
        quizId: req.query.quizId ? parseInt(req.query.quizId) : undefined,
        userId: req.query.userId ? parseInt(req.query.userId) : undefined,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await DataService.exportAttemptsToCSV(filters);

      res.status(200).json({
        success: true,
        message: 'Export completed successfully',
        data: {
          filename: result.filename,
          recordCount: result.recordCount,
          downloadUrl: `/api/admin/exports/download/${result.filename}`,
          filters: result.filters
        }
      });

    } catch (error) {
      console.error('Export attempts error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export attempts',
        error: error.message
      });
    }
  }

  /**
   * Download export file
   */
  static async downloadExport(req, res) {
    try {
      const { filename } = req.params;
      
      // Validate filename to prevent directory traversal
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid filename'
        });
      }

      const fileInfo = DataService.getExportFile(filename);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);
      res.setHeader('Content-Length', fileInfo.size);
      
      const fileStream = fs.createReadStream(fileInfo.filePath);
      fileStream.pipe(res);

    } catch (error) {
      console.error('Download export error:', error);
      res.status(404).json({
        success: false,
        message: 'Export file not found',
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

  /**
   * Get bulk operations summary
   */
  static async getBulkOperationsSummary(req, res) {
    try {
      const { quizId } = req.query;
      
      let whereClause = {};
      if (quizId) {
        whereClause.id = quizId;
      }

      // Get quiz statistics
      const quizzes = await Quiz.findAll({
        where: whereClause,
        include: [
          {
            model: Question,
            attributes: [],
            required: false
          }
        ],
        attributes: [
          'id',
          'title',
          'category',
          'createdAt',
          'expiresAt',
          [Quiz.sequelize.fn('COUNT', Quiz.sequelize.col('Questions.id')), 'questionCount']
        ],
        group: ['Quiz.id'],
        order: [['createdAt', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: {
          quizzes: quizzes.map(quiz => ({
            ...quiz.toJSON(),
            questionCount: parseInt(quiz.dataValues.questionCount) || 0
          }))
        }
      });

    } catch (error) {
      console.error('Get bulk operations summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get bulk operations summary',
        error: error.message
      });
    }
  }

  /**
   * Bulk delete questions
   */
  static async bulkDeleteQuestions(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { questionIds } = req.body;
      
      if (!Array.isArray(questionIds) || questionIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Question IDs array is required'
        });
      }

      // Validate all question IDs exist
      const questions = await Question.findAll({
        where: {
          id: questionIds
        }
      });

      if (questions.length !== questionIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Some question IDs not found'
        });
      }

      // Perform bulk soft delete
      const deletedCount = await Question.destroy({
        where: {
          id: questionIds
        }
      });

      res.status(200).json({
        success: true,
        message: `Successfully deleted ${deletedCount} questions`,
        data: {
          deletedCount,
          questionIds,
          deletedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Bulk delete questions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to bulk delete questions',
        error: error.message
      });
    }
  }

  /**
   * Clean up old export files
   */
  static async cleanupExports(req, res) {
    try {
      DataService.cleanupOldExports();
      
      res.status(200).json({
        success: true,
        message: 'Export cleanup completed successfully'
      });

    } catch (error) {
      console.error('Cleanup exports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup exports',
        error: error.message
      });
    }
  }
}

module.exports = AdminController;