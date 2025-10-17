# Hizma - Smart Vocabulary Learning

A modern, responsive vocabulary learning application built with React and styled with Tailwind CSS. Create, manage, and study custom vocabulary sets with an intuitive interface designed for effective language learning.

## Features

- **Intuitive Dashboard**: Clean interface for managing vocabulary sets
- **Set Editor**: Easy-to-use editor for creating and editing word collections
- **Language Support**: Multi-language vocabulary creation with source and target language selection
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Modern UI**: Beautiful gradient backgrounds, smooth animations, and glass-morphism effects
- **Preview System**: Live preview of enriched vocabulary cards with images and example sentences

## Tech Stack

- **React 19.1.1**: Modern React with functional components and hooks
- **Tailwind CSS 3.4.0**: Utility-first CSS framework for rapid UI development
- **PostCSS**: CSS processing for Tailwind integration
- **Modern JavaScript**: ES6+ features and best practices

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-vocabulary-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

### `npm start`
Runs the app in development mode. The page will reload when you make changes.

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder. The build is minified and optimized for best performance.

### `npm run eject`
**Note: This is a one-way operation. Once you eject, you can't go back!**

Removes the single build dependency and copies all configuration files for full control.

## Project Structure

```
src/
├── components/
│   ├── Dashboard.js      # Main dashboard component
│   └── SetEditor.js      # Vocabulary set editor
├── App.js               # Main application component
├── index.js            # Application entry point
└── index.css           # Global styles and Tailwind imports
```

## Usage

1. **Dashboard**: View and manage your vocabulary sets
2. **Create New Set**: Click the "Create New Set" button to start building a vocabulary collection
3. **Set Editor**: Add words, select languages, and preview your vocabulary cards
4. **Language Selection**: Choose source and target languages from the dropdown menus
5. **Word Input**: Enter your vocabulary words, one per line
6. **Preview**: See how your enriched vocabulary cards will look

## Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured experience with side-by-side layouts
- **Tablet**: Adapted layouts for medium screens
- **Mobile**: Touch-friendly interface optimized for small screens

## Customization

The project uses Tailwind CSS for styling, making it easy to customize:
- Colors and gradients can be modified in the component files
- Layout breakpoints are configured in `tailwind.config.js`
- Custom animations and effects are implemented with Tailwind utilities

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Contact

For questions or feedback, please open an issue on GitHub.
