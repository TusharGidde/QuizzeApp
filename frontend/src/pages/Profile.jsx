import React, { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Clock, 
  Hash,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Trash2
} from "lucide-react";
import { Profile } from "../services/profileServices";

const UserDetails = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await Profile();
      
      if (response.success && response.data?.user) {
        setUserData(response.data.user);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err.message || "Failed to fetch user data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoleColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-700';
      case 'moderator':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700';
      case 'user':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-700';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-700';
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          <button 
            onClick={fetchUserData}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mx-auto"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Retrying...' : 'Retry'}</span>
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No User Data</h2>
          <p className="text-gray-600 dark:text-gray-300">Unable to load user information.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            User Profile Details
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete user information 
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Profile Card */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white relative">
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold backdrop-blur-sm">
                  {getInitials(userData.name)}
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-1">{userData.name}</h2>
                  <p className="text-blue-100 text-sm sm:text-base mb-2">{userData.email}</p>
                  <div className="flex justify-center sm:justify-start">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(userData.role)}`}>
                      <Shield size={14} className="mr-1" />
                      {userData.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* User ID */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    User ID
                  </label>
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 group-hover:border-blue-300 dark:group-hover:border-blue-500 transition-colors">
                    <Hash className="text-blue-500 flex-shrink-0" size={20} />
                    <span className="font-mono text-lg font-semibold text-gray-900 dark:text-gray-100">
                      #{userData.id}
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div className="group">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Full Name
                  </label>
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 group-hover:border-blue-300 dark:group-hover:border-blue-500 transition-colors">
                    <User className="text-blue-500 flex-shrink-0" size={20} />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {userData.name}
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div className="group md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 group-hover:border-blue-300 dark:group-hover:border-blue-500 transition-colors">
                    <Mail className="text-blue-500 flex-shrink-0" size={20} />
                    <span className="text-gray-700 dark:text-gray-300 break-all">
                      {userData.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status and Timestamps Sidebar */}
          <div className="space-y-4">
            {/* Timestamps */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <Clock className="mr-2 text-blue-500" size={20} />
                Timeline
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar className="text-green-500" size={16} />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Created</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                    {formatDate(userData.createdAt || userData.created_at)}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <RefreshCw className="text-blue-500" size={16} />
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Last Updated</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                    {formatDate(userData.updatedAt || userData.updated_at)}
                  </p>
                </div>

                {userData.deleted_at && (
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Trash2 className="text-red-500" size={16} />
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Deleted</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                      {formatDate(userData.deleted_at)}
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;