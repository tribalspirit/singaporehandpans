import styles from '../styles/Tabs.module.scss';

interface TabsProps {
  tabs: Array<{ id: string; label: string }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className={styles.tabs} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTabChange(tab.id);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                const currentIndex = tabs.findIndex((t) => t.id === tab.id);
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                onTabChange(tabs[prevIndex].id);
              } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                const currentIndex = tabs.findIndex((t) => t.id === tab.id);
                const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                onTabChange(tabs[nextIndex].id);
              }
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

