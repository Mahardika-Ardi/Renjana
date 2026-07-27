"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInviteToken = exports.percentage = exports.average = exports.clamp = exports.isStrongPassword = exports.isValidEmail = exports.daysBetween = exports.getISOWeek = exports.formatDate = exports.slugify = exports.capitalize = void 0;
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
exports.capitalize = capitalize;
const slugify = (str) => str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
exports.slugify = slugify;
const formatDate = (date, locale = 'id-ID') => new Date(date).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});
exports.formatDate = formatDate;
const getISOWeek = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const week1 = new Date(d.getFullYear(), 0, 4);
    return {
        week: 1 +
            Math.round(((d.getTime() - week1.getTime()) / 86400000 -
                3 +
                ((week1.getDay() + 6) % 7)) /
                7),
        year: d.getFullYear(),
    };
};
exports.getISOWeek = getISOWeek;
const daysBetween = (a, b) => Math.abs(Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
exports.daysBetween = daysBetween;
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
exports.isValidEmail = isValidEmail;
const isStrongPassword = (password) => password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password);
exports.isStrongPassword = isStrongPassword;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
exports.clamp = clamp;
const average = (numbers) => numbers.length === 0
    ? 0
    : numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
exports.average = average;
const percentage = (value, total) => total === 0 ? 0 : Math.round((value / total) * 100);
exports.percentage = percentage;
const generateInviteToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 8 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
};
exports.generateInviteToken = generateInviteToken;
//# sourceMappingURL=index.js.map