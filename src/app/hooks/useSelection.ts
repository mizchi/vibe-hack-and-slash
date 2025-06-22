import { useState, useEffect, useCallback } from "react";

type SelectionOptions<T> = {
  items: T[];
  itemsPerPage: number;
  getId: (item: T) => string;
};

export const useSelection = <T>({ items, itemsPerPage, getId }: SelectionOptions<T>) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, items.length);
  const currentPageItems = items.slice(startIndex, endIndex);
  
  // 選択中のアイテムのページ内インデックスを取得
  const selectedIndex = selectedId 
    ? currentPageItems.findIndex(item => getId(item) === selectedId)
    : -1;
  
  // 初期選択
  useEffect(() => {
    if (!selectedId && currentPageItems.length > 0) {
      setSelectedId(getId(currentPageItems[0]));
    }
  }, []);
  
  // アイテムリストが変更された時の選択保持
  useEffect(() => {
    if (selectedId) {
      // 選択中のアイテムがまだ存在するか確認
      const stillExists = items.some(item => getId(item) === selectedId);
      
      if (stillExists) {
        // 選択中のアイテムがどのページにあるか確認
        const globalIndex = items.findIndex(item => getId(item) === selectedId);
        const newPage = Math.floor(globalIndex / itemsPerPage);
        
        if (newPage !== currentPage) {
          setCurrentPage(newPage);
        }
      } else {
        // 存在しない場合は現在のページの最初のアイテムを選択
        if (currentPageItems.length > 0) {
          setSelectedId(getId(currentPageItems[0]));
        } else if (currentPage > 0) {
          // 現在のページが空なら前のページへ
          setCurrentPage(currentPage - 1);
        }
      }
    }
  }, [items]);
  
  const moveUp = useCallback(() => {
    if (selectedIndex > 0) {
      // 同じページ内で上へ
      setSelectedId(getId(currentPageItems[selectedIndex - 1]));
    } else if (currentPage > 0) {
      // 前のページの最後へ
      setCurrentPage(currentPage - 1);
      const prevPageItems = items.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      );
      setSelectedId(getId(prevPageItems[prevPageItems.length - 1]));
    }
  }, [selectedIndex, currentPage, currentPageItems, items, itemsPerPage, getId]);
  
  const moveDown = useCallback(() => {
    if (selectedIndex < currentPageItems.length - 1) {
      // 同じページ内で下へ
      setSelectedId(getId(currentPageItems[selectedIndex + 1]));
    } else if (currentPage < totalPages - 1) {
      // 次のページの最初へ
      setCurrentPage(currentPage + 1);
      const nextPageItems = items.slice(
        (currentPage + 1) * itemsPerPage,
        (currentPage + 2) * itemsPerPage
      );
      setSelectedId(getId(nextPageItems[0]));
    }
  }, [selectedIndex, currentPage, currentPageItems, totalPages, items, itemsPerPage, getId]);
  
  const getSelectedItem = () => {
    return currentPageItems.find(item => getId(item) === selectedId) || null;
  };
  
  return {
    selectedId,
    selectedIndex,
    currentPage,
    totalPages,
    currentPageItems,
    startIndex,
    endIndex,
    moveUp,
    moveDown,
    setCurrentPage,
    getSelectedItem,
  };
};