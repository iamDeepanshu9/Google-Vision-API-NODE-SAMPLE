# Google Cloud Vision API Node.js Project

This project demonstrates integration with Google Cloud Vision API for image analysis using Node.js.

## Prerequisites

- Node.js >= 14
- Google Cloud Platform account
- Google Cloud Vision API enabled
- Google Cloud service account credentials

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd new-project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Set your Google Cloud credentials path in `GOOGLE_APPLICATION_CREDENTIALS`

## Configuration

The following environment variables are required:
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to your Google Cloud service account credentials JSON file

## Usage

The main functionality is in `src/index.js`. To analyze an image:

```javascript
const { analyzeImage } = require('./src/index');

async function example() {
  try {
    const labels = await analyzeImage('path/to/your/image.jpg');
    console.log('Labels:', labels);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Development

- ESLint is configured for code linting
- Use `npm run lint` to check code style
- Make sure to add tests for new features

## Error Handling

The application includes robust error handling for:
- Environment variable validation
- API client initialization
- Image analysis operations

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

# Google-Vision-API-NODE-SAMPLE
