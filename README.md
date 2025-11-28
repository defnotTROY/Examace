# examAce - AI Study Guide Generator

Transform your lecture notes and textbook content into comprehensive study guides with AI-powered summaries, key concepts, and practice questions.

## Features

- 📝 **AI-Powered Generation**: Uses Hugging Face's Llama 3.1 model to generate study guides
- 📚 **Structured Output**: Get summaries, key concepts, definitions, and practice questions
- 💾 **Export Options**: Copy to clipboard, export as .txt, or save as PDF
- 🎨 **Modern UI**: Beautiful dark-themed interface with glassmorphism effects
- ⌨️ **Keyboard Shortcuts**: Use Cmd/Ctrl + Enter for quick generation

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Hugging Face API key ([Get one here](https://huggingface.co/settings/tokens))

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd examace-fe
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local and add your Hugging Face API key
HUGGINGFACE_API_KEY=your_actual_api_key_here
HUGGINGFACE_MODEL=meta-llama/Llama-3.1-8B-Instruct
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
# Build the project
npm run build

# Start the production server
npm start
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Our Deployed App link

https://examace6.vercel.app/ 
