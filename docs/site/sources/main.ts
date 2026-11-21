import { connectTheme, connectReferenceSearch, connectCopyButtons } from './interface.ts';
import { connectPlayground } from './playground/connect-playground.ts';
import './styles.css';

connectTheme();
connectReferenceSearch();
connectCopyButtons();
connectPlayground();
