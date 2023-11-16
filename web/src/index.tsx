import React from 'react';
import ReactDom from 'react-dom/client';
import { App } from './App.js';
import { short } from './util.js';

const root = ReactDom.createRoot(
	document.getElementById('root') ?? short(Error('No root element.')),
);

root.render(<App />);
