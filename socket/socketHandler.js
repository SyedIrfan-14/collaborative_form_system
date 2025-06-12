const liveResponses = {};

module.exports = (io) => {
  io.on('connection', socket => {
    socket.on('join-form', (formCode) => {
      socket.join(formCode);
      if (liveResponses[formCode]) {
        socket.emit('form-data', liveResponses[formCode]);
      }
    });

    socket.on('field-update', ({ formCode, fieldId, value }) => {
      if (!liveResponses[formCode]) liveResponses[formCode] = {};
      liveResponses[formCode][fieldId] = value;
      socket.to(formCode).emit('field-update', { fieldId, value });
    });
  });
};