let scanning = false; // Flag to control scanning state
let scanTimeout; // To hold the timeout for 30 seconds
let video = null;
let ctx = null;
let outputCanvas = null;
let blockDataArray = []; // Array to store all block data
let startTime = null;
let lastLoggedTime = null;
let fps = 0; // Store FPS value
let progressInterval = null; // Interval for updating the progress circle
let progressStartTime = null; // Start time for the progress circle
const maxFrameCount = 900; // Maximum frame count to stop the scan
// Arrays to store rPPG signals
let rPPGRedSignals = [];
let rPPGGreenSignals = [];
let rPPGBlueSignals = [];

function onOpenCvReady() {
  console.log("OpenCV.js is ready.");
  startApp();
}

function startApp() {
  video = document.getElementById("webcam");
  outputCanvas = document.getElementById("outputCanvas");
  ctx = outputCanvas.getContext("2d", { willReadFrequently: true });

  // Access the webcam
  async function startWebcam() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "environment" }, // Request back camera
        },
      });
      video.srcObject = stream;

      // Hide loading indicator and show progress box 1 once the webcam is ready
      video.onloadeddata = () => {
        document.getElementById("loading-indicator").style.display = "none"; // Hide loading
        document.querySelector(".progress-box-1").style.display = "flex"; // Show progress box 1
        requestAnimationFrame(drawVideo); // Continuously draw the video
      };
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  }

  function toggleScan() {
    if (scanning) {
      stopScan(); // If currently scanning, stop the scan
    } else {
      startScan(); // If not scanning, start the scan
    }
  }

  function startScan() {
    scanning = true;
    frameCount = 0; // Reset frame counter at the start of each scan
    blockDataArray = []; // Clear the previous scan data
    rPPGRedSignals = []; // Clear previous red signals
    rPPGGreenSignals = []; // Clear previous green signals
    rPPGBlueSignals = []; // Clear previous blue signals

    document.getElementById("start-scan-button").textContent = "Stop Scan"; // Change button text
    document.getElementById("scan-progress-message").style.display = "block"; // Show scan progress message

    // Show Lottie animation for heartbeat
    document.getElementById("heartbeatAnimation").style.display = "block";
    // Record the start time for FPS calculation and progress circle
    startTime = performance.now();
    lastLoggedTime = startTime;

    processVideo(); // Start processing video

    // Start updating the progress circle
    updateProgressCircle();
  }

  function stopScan() {
    if (!scanning) return;
    scanning = false;

    document.getElementById("start-scan-button").textContent = "Start Scan"; // Change button text back to Start Scan
    document.getElementById("scan-progress-message").style.display = "none"; // Hide scan progress message
    // Hide Lottie animation for heartbeat
    document.getElementById("heartbeatAnimation").style.display = "none";
    clearTimeout(scanTimeout); // Clear the timeout if the user manually stops
    clearInterval(progressInterval); // Stop the progress circle updates
    resetProgressCircle(); // Reset progress circle to 0%
    // Calculate the total time taken in seconds
    let endTime = performance.now();
    let totalTimeInSeconds = (endTime - startTime) / 1000;

    // Calculate average FPS
    fps = frameCount / totalTimeInSeconds;
    // Show FPS and total time in the FPS box
    document.getElementById("fps-box").style.display = "block";
    document.getElementById("fps-value").textContent = Math.round(fps);
    document.getElementById(
      "total-time-taken"
    ).textContent = `Total Time: ${totalTimeInSeconds.toFixed(2)} seconds`;

    console.log("rPPG Red Signals: ", rPPGRedSignals);
    console.log("rPPG Green Signals: ", rPPGGreenSignals);
    console.log("rPPG Blue Signals: ", rPPGBlueSignals);
    // Calculate the total time taken in seconds
    console.log(`Total frames processed: ${frameCount}`);
    console.log(`Total time: ${totalTimeInSeconds.toFixed(2)} seconds`);
    // Calculate average FPS
    fps = frameCount / totalTimeInSeconds;
    console.log(`Average FPS: ${Math.round(fps)}`);

    document.querySelector(".progress-box-1").style.display = "none"; // Hide progress box 1
    document.querySelector(".progress-box-2").style.display = "flex"; // Show progress box 2

    // Call the function to send data to the API
    sendRppgData();
  }
  function updateProgressCircle() {
    progressInterval = setInterval(() => {
      const progressPercentage = Math.min(
        (frameCount / maxFrameCount) * 100,
        100
      ); // Ensure it doesn't exceed 100%

      // Update the progress circle's conic gradient
      const progressCircle = document.getElementById("progress-circle");
      progressCircle.style.background = `conic-gradient(#3ac0a0 ${progressPercentage}%, #ccc ${progressPercentage}% 100%)`;

      // Update the text inside the progress circle
      document.getElementById("progress-value").textContent = `${Math.round(
        progressPercentage
      )}%`;

      // Stop the interval when 100% is reached
      if (progressPercentage >= 100) {
        clearInterval(progressInterval);
      }
    }, 100); // Update every 100ms for smooth progress
  }

  function resetProgressCircle() {
    // Reset the progress circle and its value
    const progressCircle = document.getElementById("progress-circle");
    progressCircle.style.background =
      "conic-gradient(#3ac0a0 0%, #ccc 0% 100%)";
    document.getElementById("progress-value").textContent = "0%";
  }
  // Function to send rPPG data to the API
  function sendRppgData() {
    const apiUrl =
      "https://kk1l1z5qj7.execute-api.ap-south-1.amazonaws.com/dev/process-rppg";

    // Sample metadata with FPS included
    const metadata = {
      fps: fps,
      user_id: "Q2zm7hvypyWUng1TIfGELpMPKPt1",
      gender: "Male",
      email: "test@example.com",
      fullname: "John Doe",
      height: 180,
      weight: 85,
      waist: 34,
      age: 25,
    };

    // Combine the signal arrays and metadata
    const requestBody = {
      redChannel: rPPGRedSignals,
      greenChannel: rPPGGreenSignals,
      blueChannel: rPPGBlueSignals,
      metadata: metadata,
    };

    // Send the data to the API
    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Success:", data);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Event listener for the scan toggle button
  document
    .getElementById("start-scan-button")
    .addEventListener("click", toggleScan);

  // Start the webcam stream
  startWebcam();
  function drawVideo() {
    if (!scanning) {
      // No need to flip the canvas horizontally, so simply draw the video
      ctx.drawImage(video, 0, 0, video.width, video.height);
    }
    requestAnimationFrame(drawVideo); // Keep rendering the video continuously
  }

  let frameCount = 0; // Declare frame counter
  function processVideo() {
    if (!scanning) return;

    let currentTime = performance.now();
    let elapsedTime = (currentTime - lastLoggedTime) / 1000; // Time since last log in seconds

    // Log FPS every second
    if (elapsedTime >= 1) {
      fps = frameCount / ((currentTime - startTime) / 1000);
      lastLoggedTime = currentTime; // Reset last logged time
    }

    if (video.paused || video.ended) {
      requestAnimationFrame(processVideo);
      return;
    }

    frameCount++; // Increment the frame count
    console.log(`Processing frame ${frameCount}`); // Log frame count

    // End the scan if frame count exceeds 900
    if (frameCount > 900) {
      console.log("Frame count exceeds 900. Stopping the scan.");
      stopScan();
      return; // Exit the function to avoid further processing
    }

    if (frameCount % 2 === 0) {
      let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);

     // No flipping required, just draw the video as is
     ctx.drawImage(video, 0, 0, video.width, video.height);

      let imageData = ctx.getImageData(0, 0, video.width, video.height);
      src.data.set(imageData.data);

      processFrameWithROI(src, outputCanvas, ctx);
    }

    requestAnimationFrame(processVideo); // Schedule the next frame
  }
  function processFrameWithROI(frame, canvas, ctx) {
    const roiX = 20;
    const roiY = 20;
    const roiWidth = 1209;
    const roiHeight = 749;
    const numBlocksX = 10;
    const numBlocksY = 10;
    const numSignalsPerBlock = 1; // Limit to 1 signal per block

    // Arrays to store block-wise signals for this frame
    let blockRedSignals = [];
    let blockGreenSignals = [];
    let blockBlueSignals = [];

    // Calculate and process each block (ROI)
    for (let i = 0; i < numBlocksX; i++) {
      for (let j = 0; j < numBlocksY; j++) {
        let x = roiX + i * Math.floor(roiWidth / numBlocksX);
        let y = roiY + j * Math.floor(roiHeight / numBlocksY);
        let blockWidth = Math.floor(roiWidth / numBlocksX);
        let blockHeight = Math.floor(roiHeight / numBlocksY);

        if (x + blockWidth > frame.cols || y + blockHeight > frame.rows)
          continue;

        let block = frame.roi(new cv.Rect(x, y, blockWidth, blockHeight));

        // Calculate raw PPG signals for each block using getChannelDifferences()
        let redSignal = getChannelDifferences(block, 2); // Red channel differences
        let greenSignal = getChannelDifferences(block, 1); // Green channel differences
        let blueSignal = getChannelDifferences(block, 0); // Blue channel differences

        // Store block signals for later averaging, limiting to numSignalsPerBlock
        if (redSignal.length > 0) {
          let randomRedSignals = redSignal.slice(0, numSignalsPerBlock);
          blockRedSignals.push(...randomRedSignals); // Store only 1 signal
        }
        if (greenSignal.length > 0) {
          let randomGreenSignals = greenSignal.slice(0, numSignalsPerBlock);
          blockGreenSignals.push(...randomGreenSignals); // Store only 1 signal
        }
        if (blueSignal.length > 0) {
          let randomBlueSignals = blueSignal.slice(0, numSignalsPerBlock);
          blockBlueSignals.push(...randomBlueSignals); // Store only 1 signal
        }

        // Cleanup memory
        block.delete();
      }
    }

    // Average the signals across all blocks for this frame
    const avgRedSignal =
      blockRedSignals.reduce((a, b) => a + b, 0) / blockRedSignals.length || 0;
    const avgGreenSignal =
      blockGreenSignals.reduce((a, b) => a + b, 0) / blockGreenSignals.length ||
      0;
    const avgBlueSignal =
      blockBlueSignals.reduce((a, b) => a + b, 0) / blockBlueSignals.length ||
      0;

    // Store the averaged signal for this frame
    rPPGRedSignals.push(avgRedSignal);
    rPPGGreenSignals.push(avgGreenSignal);
    rPPGBlueSignals.push(avgBlueSignal);

    // Optionally display the processed frame
    cv.imshow(canvas, frame);
    frame.delete();
  }

  // Function to calculate differences in a particular channel
  function getChannelDifferences(block, channelIndex) {
    // Split the block into its channels
    let channels = new cv.MatVector();
    cv.split(block, channels);

    // Get the desired channel (Red, Green, or Blue)
    let channel = channels.get(channelIndex);
    let data = channel.data; // Access pixel data directly (faster than ucharAt)
    let differences = [];

    // Loop through rows and columns to compute differences
    for (let i = 0; i < channel.rows; i++) {
      let rowStart = i * channel.cols; // Start index of the current row
      for (let j = 1; j < channel.cols; j++) {
        let diff = data[rowStart + j] - data[rowStart + j - 1];
        if (diff > 0) {
          differences.push(diff); // Only store positive differences
        }
      }
    }

    // Cleanup to free memory
    channel.delete();
    channels.delete();
    return differences;
  }
}
