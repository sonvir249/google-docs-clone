const mongoose = require("mongoose");
const Document = require("./Document");

mongoose
  .connect("mongodb://localhost:27017/google-docs-clone", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });

const defaultValue = "";

const io = require("socket.io")(3001, {
  cors: {
    origin: "http://localhost:3000",
    method: ['GET', 'POST'],
  },
});

io.on("connection", socket => {
  socket.on("get-document", async documentId => {
    const document = await findOrCreateDoc(documentId)
    socket.join(documentId)
    socket.emit("load-document", document?.data);

    socket.on('send-changes', delta => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    })

    socket.on("save-doc", async data => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })
})

async function findOrCreateDoc(id) {
  if (!id) return;
  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({_id: id, data: defaultValue})
}
