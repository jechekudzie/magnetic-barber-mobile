/// <reference types="nativewind/types" />

/**
 * TypeScript 6 refuses a side-effect import it has no declaration for, and
 * the Tailwind entry file is imported purely for its effect on the bundle.
 */
declare module '*.css';
