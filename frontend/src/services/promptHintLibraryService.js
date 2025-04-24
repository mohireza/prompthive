import apiClient from './PromptHiveAPI'

export const promptHintLibraryService = {
    async getTextbookLibraryPromptList(spreadsheetId) {
        let response = await apiClient.get(`/api/prompt-library/active?spreadsheetId=${encodeURIComponent(spreadsheetId)}`)
        return response.data
    },

    async getAllActivePrompts(spreadsheetId) {
        let response = await apiClient.get(`/api/prompt-library/fetch-all-active-vfr567uhfr?spreadsheetId=${encodeURIComponent(spreadsheetId)}`)
        return response.data
    },

    async getLessonLibraryPromptList(spreadsheetId, lessonName) {
        let response = await apiClient.get(`/api/prompt-library/active?spreadsheetId=${encodeURIComponent(spreadsheetId)}&lessonName=${encodeURIComponent(lessonName)}`)
        console.log(response.data)
        return response.data
    },

    async commitPromptToSharedLibrary(userId, messageEntry, lessonName, sheetLink, lessonsTested) {
        messageEntry.userId = userId
        messageEntry.lessonName = lessonName
        messageEntry.isTextbookLevel = messageEntry.lessonName == null
        messageEntry.spreadsheetId = sheetLink
        messageEntry.lessonsTested = lessonsTested
        return await apiClient.post(`/api/prompt-library/commit-prompt`, messageEntry)
    },

    async commitPromptFromScratchpad(userId, messageEntry, lessonName, sheetLink, lessonsTested) {
        messageEntry.userId = userId
        messageEntry.lessonName = lessonName
        messageEntry.isTextbookLevel = messageEntry.lessonName == null
        messageEntry.spreadsheetId = sheetLink
        messageEntry.lessonsTested = lessonsTested
        return await apiClient.post(`/api/prompt-library/commit-scratchpad-prompt`, messageEntry)
    },

    async toggleLikePrompt(id, userId) {
        const response = await apiClient.post(`/api/prompt-library/toggle-like-prompt`, {userId: userId, promptId: id})
        return response
    },

    async deletePrompt(id) {
        const response = await apiClient.post(`/api/prompt-library/archive-admin-vfr567uhfr`, {promptId: id})
        return response
    },

    async deleteAllPrompts(spreadsheetId) {
        const response = await apiClient.post(`/api/prompt-library/archive-all-admin-vfr567uhfr`, {spreadsheetId: spreadsheetId})
        return response
    },

    async updateLessonsTested(promtId, lessonsTested) {
        const response = await apiClient.put(`/api/prompt-library/update-lessons-tested`, {promptId: promtId, newLessons: lessonsTested});
        return response;
    },

    async archivePrompt(promptId, userId) {
        const response = await apiClient.put(`/api/prompt-library/archive-prompt`, {userId: userId, promptId: promptId})
        return response
    },

    async visualisePromptLibraryTree(sheetId) {
        const response = await apiClient.get(`/api/prompt-library/visualize-scratchpad-tree?spreadsheetId=${sheetId}`);
        return response;
    }
}