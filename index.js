const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const sharp = require('sharp');

const bucket = 'sailing-uploads';

function handleError(error) {
  return { statusCode: 500, body: JSON.stringify({"status": "error", "message": error}) };
}

function downloadImage(key, bucket) {
  return new Promise((resolve, reject) => {
    console.log("Downloading: '" + key + "' from '" + bucket + "'.");
    s3
    .getObject({Bucket: bucket, Key: key}, (error, data) => {
      if(error) {
        console.log("Error downloading: ", error);
        return reject("Error downloading source from S3.");
      }
      console.log("Downloaded.");
      resolve(data);
    });
  });
}

// Does the actual resizing, using sharp
// https://www.npmjs.com/package/sharp
function resizeImage(width) {
  return (data => {
    return new Promise((resolve, reject) => {
      console.log("Resizing image to width '" + width + "'.");
      sharp(data.Body)
        .resize(width)
        .toBuffer((error, resizedImage, info) => {
          if(error) {
            console.log("Error resizing image:", error, info);
            return reject("Failed to resize image.");
          }

          console.log("Resized image.", info);
          return resolve(resizedImage, info);
      });
    });
  });
}

function storeResizedImage(newKey) {
  return ((resizedData, info) => {
    return new Promise((resolve, reject) => {
      console.log("Uploading resized image '" + newKey + "' to '" + outputBucket + "'.");

      s3
        .putObject({Bucket: bucket, Key: newKey, Body: resizedData.Body}, (error, data) => {
          if (error) {
            console.log("Error uploading to S3:", error);
          }

          resolve(resizedData);
        });
    });
  });
}

const url_regexp = new RegExp('^(.*)_([1-5]00)\.(jpg|png|gif)$');

exports.handler = async (event, context) => {
  var json_key = event.queryStringParameters.url;

  var match = json_key.match(url_regexp);

  if(!match) {
    return handleError('Invalid URL');
  }

  var file = match[1];
  var size = match[2];
  var contentType = match[3];

  var key = file + '.' + contentType;
  var newKey = file + '_' + size + '.' + contentType;

  var intSize = Number.parseInt(size);

  if (Number.isNaN(intSize)) {
    return handleError('Invalid Width.');
  }

  return (
    downloadImage(key, bucket)
      .then(resizeImage(intSize))
      .then(storeResizedImage(newKey))
      .then((data) => {
        console.log("Completed.");
        return {
          body: data.toString('base64'),
          headers: { 'Content-Type': 'image/'+contentType },
          isBase64Encoded: true
        };
      })
      .catch((error) => {
        return handleError(error);
      })
  );
}
