import React, { useCallback, useId, useRef } from 'react';
import styles from '../styles/WidgetTabs.module.scss';

export interface WidgetTab {
  id: string;
  label: string;
  /** Short count rendered beside the label, e.g. the number of voicings. */
  badge?: string;
  render: () => React.ReactNode;
}

interface WidgetTabsProps {
  tabs: ReadonlyArray<WidgetTab>;
  activeId: string;
  onChange: (id: string) => void;
  /** Names the tablist for assistive tech, e.g. "Handpan views". */
  label: string;
  /** `tabs` for the top-level views, `pills` for a nested group. */
  variant?: 'tabs' | 'pills';
}

/**
 * Tabs over the WAI-ARIA pattern, with a roving tabindex.
 *
 * Only the selected tab is in the tab order, so Tab moves past the whole group
 * to the panel rather than through every view. Arrow keys move within it, and
 * activation follows focus — the panels here are already mounted, so there is
 * nothing to load and nothing to gain from making the user press Enter.
 *
 * Inactive panels stay mounted and `hidden` rather than being unmounted.
 * Remounting the chord panel on every switch would reset its own sub-tab and
 * drop the memoised chord analysis, which is the expensive part.
 */
export default function WidgetTabs({
  tabs,
  activeId,
  onChange,
  label,
  variant = 'tabs',
}: WidgetTabsProps) {
  const baseId = useId();
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = (id: string) => `${baseId}-panel-${id}`;

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      const offsets: Record<string, number> = {
        ArrowRight: 1,
        ArrowDown: 1,
        ArrowLeft: -1,
        ArrowUp: -1,
      };
      const offset = offsets[event.key];
      const index = tabs.findIndex((tab) => tab.id === activeId);

      let nextIndex: number | null = null;
      if (offset !== undefined) {
        nextIndex = (index + offset + tabs.length) % tabs.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = tabs.length - 1;
      }

      if (nextIndex === null) {
        return;
      }

      event.preventDefault();
      const nextTab = tabs[nextIndex];
      onChange(nextTab.id);
      // Focus has to follow selection, or the roving tabindex strands the user
      // on a control that is no longer in the tab order.
      tabRefs.current.get(nextTab.id)?.focus();
    },
    [tabs, activeId, onChange]
  );

  return (
    <div className={styles.tabs} data-variant={variant}>
      <div className={styles.tabList} role="tablist" aria-label={label}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                if (element) {
                  tabRefs.current.set(tab.id, element);
                } else {
                  tabRefs.current.delete(tab.id);
                }
              }}
              type="button"
              role="tab"
              id={tabId(tab.id)}
              aria-controls={panelId(tab.id)}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              onClick={() => onChange(tab.id)}
              onKeyDown={handleKeyDown}
            >
              <span className={styles.tabLabel}>{tab.label}</span>
              {tab.badge && (
                <span className={styles.tabBadge}>{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <div
            key={tab.id}
            role="tabpanel"
            id={panelId(tab.id)}
            aria-labelledby={tabId(tab.id)}
            className={styles.tabPanel}
            hidden={!isActive}
            // A panel is only a tab stop when it holds no focusable content of
            // its own; these all do, so it stays out of the tab order.
            tabIndex={-1}
          >
            {tab.render()}
          </div>
        );
      })}
    </div>
  );
}
