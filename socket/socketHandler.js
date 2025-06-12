// socket/socketHandler.js

// In-memory storage for live form responses
// Note: This is not persistent and will not work across multiple server instances.
// For production scaling, use Redis or another shared store.
const liveResponses = {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    // When a user joins a form room
    socket.on('join-form', (formCode) => {
      if (typeof formCode !== 'string' || !formCode) return;
      socket.join(formCode);

      // Send current form data to the newly joined client
      if (liveResponses[formCode]) {
        socket.emit('form-data', liveResponses[formCode]);
      }
    });

    // When a user updates a field in the form
    socket.on('field-update', ({ formCode, fieldId, value }) => {
      // Basic validation
      if (
        typeof formCode !== 'string' || !formCode ||
        typeof fieldId !== 'string' || !fieldId
      ) {
        return;
      }

      if (!liveResponses[formCode]) liveResponses[formCode] = {};
      liveResponses[formCode][fieldId] = value;

      // Broadcast the field update to all other clients in the same room
      socket.to(formCode).emit('field-update', { fieldId, value });
    });
  });
};
