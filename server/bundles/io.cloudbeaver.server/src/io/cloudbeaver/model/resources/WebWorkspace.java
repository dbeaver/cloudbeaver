/*
 * DBeaver - Universal Database Manager
 * Copyright (C) 2010-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package io.cloudbeaver.model.resources;

import org.eclipse.core.resources.*;
import org.eclipse.core.runtime.*;
import org.eclipse.core.runtime.jobs.ISchedulingRule;

import java.io.InputStream;
import java.net.URI;
import java.util.Map;

/**
 * Web workspace
 */
public class WebWorkspace implements IWorkspace {

    @Override
    public void addResourceChangeListener(IResourceChangeListener listener) {

    }

    @Override
    public void addResourceChangeListener(IResourceChangeListener listener, int eventMask) {

    }

    @Override
    public ISavedState addSaveParticipant(Plugin plugin, ISaveParticipant participant) throws CoreException {
        return null;
    }

    @Override
    public ISavedState addSaveParticipant(String pluginId, ISaveParticipant participant) throws CoreException {
        return null;
    }

    @Override
    public void build(int kind, IProgressMonitor monitor) throws CoreException {

    }

    @Override
    public void build(IBuildConfiguration[] buildConfigs, int kind, boolean buildReferences, IProgressMonitor monitor) throws CoreException {

    }

    @Override
    public void checkpoint(boolean build) {

    }

    @Override
    public IProject[][] computePrerequisiteOrder(IProject[] projects) {
        return new IProject[0][];
    }

    @Override
    public ProjectOrder computeProjectOrder(IProject[] projects) {
        return null;
    }

    @Override
    public IStatus copy(IResource[] resources, IPath destination, boolean force, IProgressMonitor monitor) throws CoreException {
        return null;
    }

    @Override
    public IStatus copy(IResource[] resources, IPath destination, int updateFlags, IProgressMonitor monitor) throws CoreException {
        return null;
    }

    @Override
    public IStatus delete(IResource[] resources, boolean force, IProgressMonitor monitor) throws CoreException {
        return null;
    }

    @Override
    public IStatus delete(IResource[] resources, int updateFlags, IProgressMonitor monitor) throws CoreException {
        return null;
    }

    @Override
    public void deleteMarkers(IMarker[] markers) throws CoreException {

    }

    @Override
    public void forgetSavedTree(String pluginId) {

    }

    @Override
    public IFilterMatcherDescriptor[] getFilterMatcherDescriptors() {
        return new IFilterMatcherDescriptor[0];
    }

    @Override
    public IFilterMatcherDescriptor getFilterMatcherDescriptor(String filterMatcherId) {
        return null;
    }

    @Override
    public IProjectNatureDescriptor[] getNatureDescriptors() {
        return new IProjectNatureDescriptor[0];
    }

    @Override
    public IProjectNatureDescriptor getNatureDescriptor(String natureId) {
        return null;
    }

    @Override
    public Map<IProject, IProject[]> getDanglingReferences() {
        return null;
    }

    @Override
    public IWorkspaceDescription getDescription() {
        return null;
    }

    @Override
    public IWorkspaceRoot getRoot() {
        return null;
    }

    @Override
    public IResourceRuleFactory getRuleFactory() {
        return null;
    }

    @Override
    public ISynchronizer getSynchronizer() {
        return null;
    }

    @Override
    public boolean isAutoBuilding() {
        return false;
    }

    @Override
    public boolean isTreeLocked() {
        return false;
    }

    @Override
    public IProjectDescription loadProjectDescription(IPath projectDescriptionFile) throws CoreException {
        return null;
    }

    @Override
    public IProjectDescription loadProjectDescription(InputStream projectDescriptionFile) throws CoreException {
        return null;
    }

    @Override
    public IStatus move(IResource[] resources, IPath destination, boolean force, IProgressMonitor monitor) throws CoreException {
        return null;
    }

    @Override
    public IStatus move(IResource[] resources, IPath destination, int updateFlags, IProgressMonitor monitor) throws CoreException {
        return null;
    }

    @Override
    public IBuildConfiguration newBuildConfig(String projectName, String configName) {
        return null;
    }

    @Override
    public IProjectDescription newProjectDescription(String projectName) {
        return null;
    }

    @Override
    public void removeResourceChangeListener(IResourceChangeListener listener) {

    }

    @Override
    public void removeSaveParticipant(Plugin plugin) {

    }

    @Override
    public void removeSaveParticipant(String pluginId) {

    }

    @Override
    public void run(ICoreRunnable action, ISchedulingRule rule, int flags, IProgressMonitor monitor) throws CoreException {

    }

    @Override
    public void run(ICoreRunnable action, IProgressMonitor monitor) throws CoreException {

    }

    @Override
    public void run(IWorkspaceRunnable action, ISchedulingRule rule, int flags, IProgressMonitor monitor) throws CoreException {

    }

    @Override
    public void run(IWorkspaceRunnable action, IProgressMonitor monitor) throws CoreException {

    }

    @Override
    public IStatus save(boolean full, IProgressMonitor monitor) throws CoreException {
        return null;
    }

    @Override
    public void setDescription(IWorkspaceDescription description) throws CoreException {

    }

    @Override
    public String[] sortNatureSet(String[] natureIds) {
        return new String[0];
    }

    @Override
    public IStatus validateEdit(IFile[] files, Object context) {
        return null;
    }

    @Override
    public IStatus validateFiltered(IResource resource) {
        return null;
    }

    @Override
    public IStatus validateLinkLocation(IResource resource, IPath location) {
        return null;
    }

    @Override
    public IStatus validateLinkLocationURI(IResource resource, URI location) {
        return null;
    }

    @Override
    public IStatus validateName(String segment, int typeMask) {
        return null;
    }

    @Override
    public IStatus validateNatureSet(String[] natureIds) {
        return null;
    }

    @Override
    public IStatus validatePath(String path, int typeMask) {
        return null;
    }

    @Override
    public IStatus validateProjectLocation(IProject project, IPath location) {
        return null;
    }

    @Override
    public IStatus validateProjectLocationURI(IProject project, URI location) {
        return null;
    }

    @Override
    public IPathVariableManager getPathVariableManager() {
        return null;
    }

    @Override
    public <T> T getAdapter(Class<T> adapter) {
        return null;
    }
}
