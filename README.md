ImageProxy
==========

Takes input images from S3 and resizes them to the desired size (by width, within a range).


Deployment
=========

1. Upload zip to lambda
2. Configure S3 buckets on lambda, input and output.
3. Configure api gateway to allow GET requests passing through "url".
4. Configure output bucket with s3 static hosting and use redirect.xml to redirect to lambda.
5. Add bucket policy for public access.

```
{
    "Version": "2008-10-17",
    "Id": "Policy1397632521960",
    "Statement": [
        {
            "Sid": "Public Access",
            "Effect": "Allow",
            "Principal": {
                "AWS": "*"
            },
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::output-bucket-name/*"
        }
    ]
}
```

Optional for HTTPS

5. Add cloudfront distributuon *using the S3 website url* (not the direct url)
6. Add appropriate DNS and Amazon cert
