import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import type { Pipeline, Stage, Deal, CreateDealInput, UpdateDealInput } from "@shared/types/crm";
import * as api from "../../api/client";
import PipelineSelector from "./PipelineSelector";
import StageColumn from "./StageColumn";
import DealCard from "./DealCard";
import DealForm from "./DealForm";
import { useModal } from "../../contexts/ModalContext";

export default function PipelineBoard() {
  const { confirm } = useModal();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [modalState, setModalState] = useState<{
    open: boolean;
    stageId?: string;
    deal?: Deal;
  }>({ open: false });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Fetch pipelines
  useEffect(() => {
    api.listPipelines().then((ps) => {
      setPipelines(ps);
      const defaultP = ps.find((p) => p.is_default) || ps[0];
      if (defaultP) setSelectedPipelineId(defaultP.id);
    }).catch(console.error);
  }, []);

  // Fetch deals for selected pipeline
  const fetchDeals = useCallback(async () => {
    if (!selectedPipelineId) return;
    setLoading(true);
    try {
      const d = await api.listDeals({ pipeline_id: selectedPipelineId });
      setDeals(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedPipelineId]);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const selectedPipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const stages = selectedPipeline?.stages || [];

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    const map = new Map<string, Deal[]>();
    for (const stage of stages) {
      map.set(stage.id, []);
    }
    for (const deal of deals) {
      const arr = map.get(deal.stage_id);
      if (arr) arr.push(deal);
    }
    // Sort by position within each stage
    for (const arr of map.values()) {
      arr.sort((a, b) => a.position - b.position);
    }
    return map;
  }, [deals, stages]);

  const handleDragStart = (event: DragStartEvent) => {
    const deal = event.active.data.current?.deal as Deal;
    if (deal) setActiveDeal(deal);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);
    if (!over) return;

    const activeDealData = active.data.current;
    if (!activeDealData || activeDealData.type !== "deal") return;

    const draggedDeal = activeDealData.deal as Deal;
    let targetStageId: string;
    let targetPosition: number;

    const overData = over.data.current;
    if (overData?.type === "stage") {
      targetStageId = overData.stageId;
      const stageDeals = dealsByStage.get(targetStageId) || [];
      targetPosition = stageDeals.length;
    } else if (overData?.type === "deal") {
      const overDeal = overData.deal as Deal;
      targetStageId = overDeal.stage_id;
      const stageDeals = dealsByStage.get(targetStageId) || [];
      const overIndex = stageDeals.findIndex((d) => d.id === overDeal.id);
      targetPosition = overIndex >= 0 ? overIndex : stageDeals.length;
    } else {
      return;
    }

    if (draggedDeal.stage_id === targetStageId && draggedDeal.position === targetPosition) return;

    // Optimistic update
    setDeals((prev) => {
      const filtered = prev.filter((d) => d.id !== draggedDeal.id);
      const updated = { ...draggedDeal, stage_id: targetStageId, position: targetPosition };
      const result = [...filtered, updated];
      return result;
    });

    // Sync with server
    api.moveDeal(draggedDeal.id, { stage_id: targetStageId, position: targetPosition })
      .then(() => fetchDeals())
      .catch(() => fetchDeals());
  };

  const handleCreateDeal = async (input: CreateDealInput) => {
    try {
      await api.createDeal(input);
      await fetchDeals();
      setModalState({ open: false });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDeal = async (input: UpdateDealInput) => {
    if (!modalState.deal) return;
    try {
      await api.updateDeal(modalState.deal.id, input);
      await fetchDeals();
      setModalState({ open: false });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    const ok = await confirm({ message: "Delete this deal?", variant: "destructive", confirmLabel: "Delete" });
    if (!ok) return;
    try {
      await api.deleteDeal(dealId);
      await fetchDeals();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && pipelines.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-surface-400 text-sm">Loading pipelines...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-5 py-3 flex items-center gap-3 border-b border-surface-100">
        <PipelineSelector
          pipelines={pipelines}
          selectedId={selectedPipelineId}
          onSelect={setSelectedPipelineId}
        />
        <span className="text-xs text-surface-400">
          {deals.length} deal{deals.length !== 1 ? "s" : ""}
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 p-5 overflow-x-auto">
          {stages.map((stage) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              deals={dealsByStage.get(stage.id) || []}
              onAddDeal={() => setModalState({ open: true, stageId: stage.id })}
              onEditDeal={(deal) => setModalState({ open: true, deal, stageId: deal.stage_id })}
              onDeleteDeal={handleDeleteDeal}
            />
          ))}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <div className="opacity-80">
              <DealCard deal={activeDeal} onClick={() => {}} onDelete={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {modalState.open && selectedPipelineId && (
        <DealForm
          deal={modalState.deal || null}
          stageId={modalState.stageId || stages[0]?.id || ""}
          pipelineId={selectedPipelineId}
          onSave={(input) => modalState.deal ? handleUpdateDeal(input as UpdateDealInput) : handleCreateDeal(input as CreateDealInput)}
          onClose={() => setModalState({ open: false })}
        />
      )}
    </div>
  );
}
