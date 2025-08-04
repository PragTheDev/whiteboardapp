// Whiteboard utility functions

export const getMousePos = (e, canvas) => {
  const rect = canvas.getBoundingClientRect();

  // Handle both mouse and touch events
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
};

export const drawGrid = (ctx, width, height, gridSize = 20) => {
  ctx.save();
  ctx.strokeStyle = "#E5E7EB";
  ctx.lineWidth = 0.5;
  ctx.setLineDash([]);

  // Vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.restore();
};

export const drawOnCanvas = (canvas, data) => {
  const ctx = canvas.getContext("2d");

  if (data.tool === "eraser" || data.color === "#FFFFFF") {
    ctx.globalCompositeOperation = "destination-out";
  } else {
    ctx.globalCompositeOperation = "source-over";
  }

  ctx.strokeStyle = data.color;
  ctx.lineWidth = data.size;
  ctx.lineTo(data.x, data.y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(data.x, data.y);
};

export const drawShape = (canvas, data) => {
  const ctx = canvas.getContext("2d");

  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = data.color;
  ctx.lineWidth = data.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const { startPos, endPos, tool } = data;
  const width = endPos.x - startPos.x;
  const height = endPos.y - startPos.y;

  ctx.beginPath();

  switch (tool) {
    case "line":
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(endPos.x, endPos.y);
      ctx.stroke();
      break;
    case "rectangle":
      ctx.rect(startPos.x, startPos.y, width, height);
      ctx.stroke();
      break;
    case "circle":
      const radius = Math.sqrt(width * width + height * height) / 2;
      const centerX = startPos.x + width / 2;
      const centerY = startPos.y + height / 2;
      ctx.arc(centerX, centerY, Math.abs(radius), 0, 2 * Math.PI);
      ctx.stroke();
      break;
  }
};

export const drawShapePreview = (
  previewCanvas,
  startPos,
  endPos,
  tool,
  currentColor,
  brushSize
) => {
  if (!previewCanvas) return;

  const previewCtx = previewCanvas.getContext("2d");

  // Clear preview canvas
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

  // Set preview style
  previewCtx.globalCompositeOperation = "source-over";
  previewCtx.strokeStyle = currentColor;
  previewCtx.lineWidth = brushSize;
  previewCtx.lineCap = "round";
  previewCtx.lineJoin = "round";
  previewCtx.setLineDash([5, 5]); // Dashed line for preview

  const width = endPos.x - startPos.x;
  const height = endPos.y - startPos.y;

  previewCtx.beginPath();

  switch (tool) {
    case "line":
      previewCtx.moveTo(startPos.x, startPos.y);
      previewCtx.lineTo(endPos.x, endPos.y);
      previewCtx.stroke();
      break;
    case "rectangle":
      previewCtx.rect(startPos.x, startPos.y, width, height);
      previewCtx.stroke();
      break;
    case "circle":
      const radius = Math.sqrt(width * width + height * height) / 2;
      const centerX = startPos.x + width / 2;
      const centerY = startPos.y + height / 2;
      previewCtx.arc(centerX, centerY, Math.abs(radius), 0, 2 * Math.PI);
      previewCtx.stroke();
      break;
  }

  // Reset line dash
  previewCtx.setLineDash([]);
};

export const clearCanvas = (canvas, backgroundColor, isGridVisible) => {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Redraw grid if enabled
  if (isGridVisible) {
    drawGrid(ctx, canvas.width, canvas.height);
  }
};

export const restoreCanvasFromImageData = (canvas, imageData) => {
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = imageData;
};

export const loadImageToCanvas = (
  canvas,
  file,
  backgroundColor,
  isGridVisible,
  saveCanvasState
) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext("2d");

      // Clear canvas first
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid if enabled
      if (isGridVisible) {
        drawGrid(ctx, canvas.width, canvas.height);
      }

      // Calculate aspect ratio and draw image
      const aspectRatio = img.width / img.height;
      let drawWidth = canvas.width;
      let drawHeight = canvas.width / aspectRatio;

      if (drawHeight > canvas.height) {
        drawHeight = canvas.height;
        drawWidth = canvas.height * aspectRatio;
      }

      const x = (canvas.width - drawWidth) / 2;
      const y = (canvas.height - drawHeight) / 2;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      saveCanvasState("upload", {
        fileName: file.name,
        dimensions: { width: drawWidth, height: drawHeight },
      });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

export const saveCanvas = (canvas, showNotification) => {
  const link = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  link.download = `whiteboard-${timestamp}.png`;
  link.href = canvas.toDataURL();
  link.click();

  // Show save notification
  showNotification(true);
  setTimeout(() => showNotification(false), 3000);
};
