import axios from '../axios';

export const adminService = {
    getLogs: async (params) => {
        const response = await axios.get('admin/logs', { params });
        return response.data;
    },
    getNotices: async () => {
        const response = await axios.get('admin/notices');
        return response.data;
    },
    getEmployees: async () => {
        const response = await axios.get('admin/employees');
        return response.data;
    },
    getOffices: async () => {
        const response = await axios.get('admin/offices');
        return response.data;
    }
};
