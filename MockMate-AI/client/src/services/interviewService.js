import API from './api';

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  const response = await API.post('/resume/upload', formData);
  return response.data.data;
};

export const getResume = async () => {
  const response = await API.get('/resume');
  return response.data.data;
};

export const startInterview = async (payload) => {
  const response = await API.post('/interview/start', payload);
  return response.data.data;
};

export const getInterview = async (id) => {
  const response = await API.get(`/interview/${id}`);
  return response.data.data;
};

export const submitTextAnswer = async (id, answer) => {
  const response = await API.post(`/interview/${id}/answer`, { answer });
  return response.data.data;
};

export const submitVoiceAnswer = async (id, audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'answer.webm');
  const response = await API.post(`/interview/${id}/answer/voice`, formData);
  return response.data.data;
};

export const transcribeAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'answer.webm');
  const response = await API.post('/interview/transcribe', formData);
  return response.data.data;
};

export const submitCode = async (id, code, language) => {
  const response = await API.post(`/interview/${id}/code`, { code, language });
  return response.data.data;
};

export const endInterview = async (id) => {
  const response = await API.post(`/interview/${id}/end`);
  return response.data.data;
};
